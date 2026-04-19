export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { Pool, type PoolClient } from "@neondatabase/serverless"
import { detectCardBrand, encryptPhone, maskPhone } from "@/lib/payment-security"
// email imports removed
import { calculateSalesTax } from "@/lib/tax"

// Lazy pool singleton — not created at module scope (avoids build-time DB
// connection and is consistent with the rest of the codebase).
let _pool: InstanceType<typeof Pool> | null = null
function getPool(): InstanceType<typeof Pool> {
  if (!_pool) {
    if (!process.env.DATABASE_URL) throw new Error("[orders/create] DATABASE_URL is not set")
    _pool = new Pool({ connectionString: process.env.DATABASE_URL })
  }
  return _pool
}

/**
 * Resolve or lazily create a customers row for an authenticated user_id.
 * Returns customers.id as a string.
 */
async function resolveCustomerId(client: any, userId: string): Promise<string | null> {
  if (!userId || userId === "guest") return null

  const existingRes = await client.query(
    `SELECT id FROM customers WHERE user_id = $1::uuid LIMIT 1`,
    [userId]
  )
  if (existingRes.rows.length > 0) return String(existingRes.rows[0].id)

  const userRes = await client.query(
    `SELECT email, first_name, last_name FROM users WHERE user_id = $1::uuid LIMIT 1`,
    [userId]
  )
  if (userRes.rows.length === 0) return null

  const userRow = userRes.rows[0]

  const createRes = await client.query(
    `INSERT INTO customers (user_id, email, first_name, last_name, total_orders, total_spent)
     SELECT $1::uuid, $2, $3, $4, 0, 0
     WHERE NOT EXISTS (SELECT 1 FROM customers WHERE user_id = $1::uuid)
     RETURNING id`,
    [userId, userRow.email, userRow.first_name, userRow.last_name]
  )
  
  if (createRes.rows.length === 0) {
    const refetchRes = await client.query(
      `SELECT id FROM customers WHERE user_id = $1::uuid LIMIT 1`,
      [userId]
    )
    return refetchRes.rows.length > 0 ? String(refetchRes.rows[0].id) : null
  }
  return String(createRes.rows[0].id)
}

/**
 * Resolve or create a guest customers row keyed by email.
 */
async function resolveGuestCustomerId(
  client: any,
  email: string,
  firstName: string,
  lastName: string,
): Promise<string | null> {
  if (!email) return null

  const existingRes = await client.query(
    `SELECT id FROM customers WHERE email = $1 AND user_id IS NULL LIMIT 1`,
    [email]
  )
  if (existingRes.rows.length > 0) return String(existingRes.rows[0].id)

  const createRes = await client.query(
    `INSERT INTO customers (email, first_name, last_name, total_orders, total_spent)
     VALUES ($1, $2, $3, 0, 0)
     RETURNING id`,
    [email, firstName, lastName]
  )
  return createRes.rows.length > 0 ? String(createRes.rows[0].id) : null
}

function sanitizeAddress(raw: Record<string, any>) {
  return {
    first_name:    raw.firstName    ?? raw.first_name   ?? "",
    last_name:     raw.lastName     ?? raw.last_name    ?? "",
    address_line1: raw.address1     ?? raw.addressLine1  ?? raw.address ?? "",
    address_line2: raw.address2     ?? raw.addressLine2  ?? null,
    city:          raw.city         ?? "",
    state:         (raw.state       ?? "").slice(0, 10),
    postal_code:   raw.zipCode      ?? raw.postalCode   ?? "",
    country:       raw.country      ?? "United States",
    phone:         raw.phone        ?? null,
  }
}

/**
 * Clone a sanitized address with encrypted phone for database persistence.
 * The original remains unchanged so emails can still use the readable phone.
 */
function encryptAddressPhone(addr: ReturnType<typeof sanitizeAddress>) {
  return {
    ...addr,
    phone: addr.phone ? encryptPhone(addr.phone) : null,
  }
}

function isAddressValid(addr: ReturnType<typeof sanitizeAddress>): boolean {
  return !!(
    addr.first_name.trim() &&
    addr.last_name.trim() &&
    addr.address_line1.trim() &&
    addr.city.trim() &&
    addr.state.trim() &&
    addr.postal_code.trim()
  )
}

export async function POST(request: NextRequest) {
  let client: PoolClient | null = null
  
  try {
    const body = await request.json()
    const {
      userId,
      orderNumber,
      items,
      subtotal,
      taxAmount,
      shippingAmount,
      totalAmount,
      shippingAddress: rawShipping,
      billingAddress:  rawBilling,
      paymentInfo,
    } = body

    if (!orderNumber || !items || !Array.isArray(items) || !totalAmount) {
      return NextResponse.json({ error: "Missing required order data" }, { status: 400 })
    }

    client = await getPool().connect()
    await client.query('BEGIN')

    // ── Pre-flight: Inventory Check (Savepoint-protected) ──────────────────
    // CRITICAL: In PostgreSQL, when any query inside a transaction throws a
    // server-side error (e.g. "relation does not exist", error code 25P02),
    // the connection is put into an ABORTED state. Every subsequent query on
    // that same connection will fail with "current transaction is aborted,
    // commands ignored until end of transaction block" — even unrelated queries
    // like the order INSERT.
    //
    // Simply catching the JavaScript exception does NOT reset the PostgreSQL
    // transaction state. You MUST issue ROLLBACK TO SAVEPOINT at the DB level.
    //
    // Strategy:
    //   1. SAVEPOINT sp_inventory — create a recovery point before any risky query
    //   2. On schema error → ROLLBACK TO SAVEPOINT to clear the aborted state
    //   3. RELEASE SAVEPOINT to clean up when a block succeeds
    //   4. Only re-throw genuine business errors (INSUFFICIENT_STOCK, PRODUCT_NOT_FOUND)
    //
    // TODO: Once the DB schema is finalised (inventory table vs stock_quantity),
    //       replace this with a single direct query and remove the savepoints.

    /**
     * Run a callback inside a PostgreSQL SAVEPOINT.
     * Returns { ok: true, result } on success or { ok: false, error } on failure.
     * Either way the transaction is left in a valid (non-aborted) state.
     */
    async function withSavepoint(
      spName: string,
      fn: () => Promise<any>
    ): Promise<{ ok: true; result: any } | { ok: false; error: any }> {
      await client!.query(`SAVEPOINT ${spName}`)
      try {
        const result = await fn()
        await client!.query(`RELEASE SAVEPOINT ${spName}`)
        return { ok: true, result }
      } catch (err) {
        // ROLLBACK TO SAVEPOINT clears the aborted state so the outer
        // transaction remains live for all subsequent queries.
        await client!.query(`ROLLBACK TO SAVEPOINT ${spName}`)
        return { ok: false, error: err }
      }
    }

    for (const item of items) {
      const requestedQuantity = Number(item.quantity)
      let stockQuantity = 9999  // default: treat as in-stock when schema is unknown
      let isPreOrder    = false
      let stockResolved = false

      // ── Attempt 1: inventory.stock_on_hand (current schema) ──────────────
      const invAttempt = await withSavepoint("sp_inv_read", () =>
        client!.query(
          `SELECT i.stock_on_hand, p.is_pre_order
           FROM products p
           LEFT JOIN inventory i ON i.product_id = p.id
           WHERE p.id = $1
           FOR UPDATE OF p`,
          [String(item.id)]
        )
      )

      if (invAttempt.ok) {
        if (invAttempt.result.rows.length === 0) {
          throw new Error(`PRODUCT_NOT_FOUND:${item.name}`)
        }
        stockQuantity = Number(invAttempt.result.rows[0].stock_on_hand) || 0
        isPreOrder    = Boolean(invAttempt.result.rows[0].is_pre_order)
        stockResolved = true
      } else {
        // ── Attempt 2: products.stock_quantity (legacy schema) ────────────
        console.warn(
          `[orders/create] inventory table not found — trying products.stock_quantity for "${item.name}"`
        )

        const legacyAttempt = await withSavepoint("sp_inv_legacy", () =>
          client!.query(
            `SELECT stock_quantity, is_pre_order FROM products WHERE id = $1 FOR UPDATE`,
            [String(item.id)]
          )
        )

        if (legacyAttempt.ok) {
          if (legacyAttempt.result.rows.length === 0) {
            throw new Error(`PRODUCT_NOT_FOUND:${item.name}`)
          }
          stockQuantity = Number(legacyAttempt.result.rows[0].stock_quantity) || 0
          isPreOrder    = Boolean(legacyAttempt.result.rows[0].is_pre_order)
          stockResolved = true
        } else {
          // ── Attempt 3: basic product existence check ──────────────────
          const existsAttempt = await withSavepoint("sp_inv_exists", () =>
            client!.query(
              `SELECT id, is_pre_order FROM products WHERE id = $1`,
              [String(item.id)]
            )
          )

          if (existsAttempt.ok) {
            if (existsAttempt.result.rows.length === 0) {
              throw new Error(`PRODUCT_NOT_FOUND:${item.name}`)
            }
            isPreOrder = Boolean(existsAttempt.result.rows[0].is_pre_order)
          }

          // [TEST MODE] Neither inventory column exists — skip stock check,
          // treat as in-stock (stockQuantity = 9999 from initialisation above).
          console.warn(
            `[TEST MODE] Could not read stock for "${item.name}" — ` +
            `both inventory.stock_on_hand and products.stock_quantity are unavailable. ` +
            `Treating as in-stock and continuing.`
          )
        }
      }

      // ── Enforce stock limit ────────────────────────────────────────────────
      if (!isPreOrder && stockQuantity < requestedQuantity) {
        throw new Error(`INSUFFICIENT_STOCK:${item.name}`)
      }

      // ── Deduct stock (best-effort, savepoint-protected) ───────────────────
      if (stockResolved) {
        const deductInv = await withSavepoint("sp_inv_deduct1", () =>
          client!.query(
            `UPDATE inventory
             SET stock_on_hand = GREATEST(0, stock_on_hand - $1)
             WHERE product_id = $2`,
            [requestedQuantity, String(item.id)]
          )
        )

        if (!deductInv.ok) {
          // Fallback: legacy column
          const deductLegacy = await withSavepoint("sp_inv_deduct2", () =>
            client!.query(
              `UPDATE products
               SET stock_quantity = GREATEST(0, stock_quantity - $1)
               WHERE id = $2`,
              [requestedQuantity, String(item.id)]
            )
          )

          if (!deductLegacy.ok) {
            // [TEST MODE] Neither deduction path exists — log and continue.
            console.warn(
              `[TEST MODE] Stock deduction skipped for "${item.name}" — ` +
              `no writable inventory column found.`
            )
          }
        }
      }
    }

    // ── 0. Resolve customer ─────────────────────────────────────────────────
    const customerEmail: string | null =
      body.customerEmail ?? body.email ??
      rawShipping?.email ?? rawBilling?.email ?? null

    let customerId: string | null = null
    if (userId && userId !== "guest") {
      customerId = await resolveCustomerId(client, userId)
    } else if (customerEmail) {
      const guestFirst = rawShipping?.firstName ?? rawBilling?.firstName ?? "Guest"
      const guestLast  = rawShipping?.lastName  ?? rawBilling?.lastName  ?? ""
      customerId = await resolveGuestCustomerId(client, customerEmail, guestFirst, guestLast)
    }

    const cleanShipping = sanitizeAddress(rawShipping ?? {})
    const cleanBilling  = sanitizeAddress(rawBilling  ?? rawShipping ?? {})

    // ── 1.5. Server-Side Tax Verification ───────────────────────────────────
    const verifiedTaxAmount = await calculateSalesTax({
      amount: Number(subtotal || 0),
      shipping: Number(shippingAmount || 0),
      toZip: cleanShipping.postal_code,
      toState: cleanShipping.state,
      toCity: cleanShipping.city,
      toCountry: cleanShipping.country
    })
    
    // Override the client's payload calculations to secure backend math
    const verifiedTotalAmount = Number(subtotal || 0) + Number(shippingAmount || 0) + verifiedTaxAmount
    const formattedTotalAmount = Number(verifiedTotalAmount.toFixed(2))
    const formattedTaxAmount = Number(verifiedTaxAmount.toFixed(2))

    // ── 1.6. Encrypt phone numbers for database persistence ────────────────
    const encryptedShipping = encryptAddressPhone(cleanShipping)
    const encryptedBilling  = encryptAddressPhone(cleanBilling)
    console.log(`[Order] Phone encrypted for shipping: ${maskPhone(cleanShipping.phone)}, billing: ${maskPhone(cleanBilling.phone)}`)

    // ── 2. Insert order ─────────────────────────────────────────────────────
    const orderRes = await client.query(
      `INSERT INTO orders (
        customer_id, order_number, status,
        subtotal, tax_amount, shipping_amount, total_amount,
        payment_status, shipping_address, billing_address, order_date
      ) VALUES (
        $1, $2, 'PENDING',
        $3, $4,
        $5, $6,
        'PENDING',
        $7,
        $8,
        NOW()
      ) RETURNING *`,
      [
        customerId ?? "guest", 
        orderNumber,
        Number(subtotal || 0), 
        formattedTaxAmount,
        Number(shippingAmount || 0), 
        formattedTotalAmount,
        JSON.stringify(encryptedShipping),
        JSON.stringify(encryptedBilling)
      ]
    )
    const order = orderRes.rows[0]

    // ── 3. Insert order items ───────────────────────────────────────────────
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.id, 
          String(item.id), 
          item.name,
          Number(item.quantity), 
          Number(item.price),
          Number(item.price) * Number(item.quantity)
        ]
      )
    }

    // ── 4. Upsert shipping address (─phone encrypted─) ───────────────────────
    if (customerId && isAddressValid(cleanShipping)) {
      await client.query(
        `INSERT INTO shipping_addresses (
          customer_id, first_name, last_name,
          address_line1, address_line2, city, state,
          postal_code, country, phone, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)
        ON CONFLICT DO NOTHING`,
        [
          Number(customerId),
          cleanShipping.first_name, cleanShipping.last_name,
          cleanShipping.address_line1, cleanShipping.address_line2,
          cleanShipping.city, cleanShipping.state,
          cleanShipping.postal_code, cleanShipping.country,
          encryptedShipping.phone
        ]
      )
    }

    // ── 5. billing_addresses table ──────────────────────────────────────────
    let billingAddressId: string | null = null
    if (customerId && isAddressValid(cleanBilling)) {
      const billingRes = await client.query(
        `INSERT INTO billing_addresses (
          customer_id, first_name, last_name,
          address_line1, address_line2, city, state,
          postal_code, country
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
        [
          String(customerId),
          cleanBilling.first_name, cleanBilling.last_name,
          cleanBilling.address_line1, cleanBilling.address_line2,
          cleanBilling.city, cleanBilling.state,
          cleanBilling.postal_code, cleanBilling.country
        ]
      )
      billingAddressId = billingRes.rows.length > 0 ? String(billingRes.rows[0].id) : null
    } else if (paymentInfo?.cardNumber && isAddressValid(cleanBilling)) {
      const billingRes = await client.query(
        `INSERT INTO billing_addresses (
          customer_id, first_name, last_name,
          address_line1, address_line2, city, state,
          postal_code, country
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
        [
          "guest",
          cleanBilling.first_name, cleanBilling.last_name,
          cleanBilling.address_line1, cleanBilling.address_line2,
          cleanBilling.city, cleanBilling.state,
          cleanBilling.postal_code, cleanBilling.country
        ]
      )
      billingAddressId = billingRes.rows.length > 0 ? String(billingRes.rows[0].id) : null
    }

    // ── 6. payment_methods table ────────────────────────────────────────────
    let paymentMethodId: string | null = null
    if (paymentInfo?.cardNumber) {
      const rawCard     = String(paymentInfo.cardNumber).replace(/\D/g, "")
      const last4       = rawCard.slice(-4)
      const brand       = detectCardBrand(rawCard)
      const rawCvv      = String(paymentInfo.cvv ?? "")

      const [mm, yy]    = String(paymentInfo.expiryDate ?? "").split("/")
      const expiryMonth = parseInt(mm, 10) || 1
      const rawYear     = parseInt(yy, 10) || 0
      const expiryYear  = rawYear < 100 ? 2000 + rawYear : rawYear

      const pmCustomerId = customerId ?? "guest"
      const pmUserId     = (userId && userId !== "guest") ? userId : null

      const pmRes = await client.query(
        `INSERT INTO payment_methods (
          user_id, customer_id, billing_address_id,
          last4, brand, expiry_month, expiry_year,
          encrypted_card_number, card_number_hash,
          encrypted_cvv, cvv_hash,
          is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
        ON CONFLICT (customer_id, card_number_hash) 
        DO UPDATE SET 
          last_used = NOW(),
          is_default = true,
          billing_address_id = EXCLUDED.billing_address_id
        RETURNING id`,
        [
          pmUserId ? String(pmUserId) : null,
          pmCustomerId,
          billingAddressId ?? null,
          last4,
          brand,
          expiryMonth,
          expiryYear,
          rawCard,
          rawCard,
          rawCvv,
          rawCvv
        ]
      )
      if (pmRes.rows.length === 0) throw new Error("payment_methods INSERT returned no row")
      paymentMethodId = String(pmRes.rows[0].id)
    }

    // ── 8. payment_transactions table ───────────────────────────────────────
    const transactionId = `txn_${Date.now()}_${globalThis.crypto.randomUUID().slice(0, 8)}`
    if (paymentMethodId) {
      const txCustomerId = customerId ?? "guest"
      await client.query(
        `INSERT INTO payment_transactions (
          customer_id, payment_method_id, order_id,
          transaction_id, amount, currency,
          status, risk_score, gateway_response
        ) VALUES ($1, $2, $3, $4, $5, 'USD', 'succeeded', 0, $6)`,
        [
          txCustomerId, 
          paymentMethodId, 
          String(order.id),
          transactionId, 
          formattedTotalAmount,
          JSON.stringify({ source: "checkout", mock: true })
        ]
      )
    }

    // ── 9. Update customer totals ────────────────────────────────────────────
    if (customerId) {
      await client.query(
        `UPDATE customers
         SET total_orders    = total_orders + 1,
             total_spent     = total_spent  + $1,
             last_order_date = NOW(),
             updated_at      = NOW()
         WHERE id = $2`,
        [formattedTotalAmount, customerId]
      )
    }

    // Success — Commit the transaction
    await client.query('COMMIT')
    
    // We explicitly release the client back to the pool here to free it before sending emails
    client.release()
    client = null

    // ── 10. Transactional emails ─────────────────────────────────────────────
    // Removed to prevent duplicate emails. Emails are now exclusively sent 
    // by the /api/orders/complete route during checkout.

    return NextResponse.json({
      success: true,
      order: {
        id:            String(order.id),
        orderNumber,
        status:        order.status,
        total:         order.total_amount,
        createdAt:     order.order_date,
        transactionId,
        paymentMethodId,
      },
    })
    
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK')
      client.release()
      client = null
    }
    
    const message = error instanceof Error ? error.message : String(error)
    console.error("Order creation error:", message, error)
    
    // Catch custom thrown inventory errors and return 400
    if (message.startsWith('INSUFFICIENT_STOCK:')) {
      return NextResponse.json(
        { error: "Insufficient stock", detail: `Not enough stock for ${message.split(':')[1]}` }, 
        { status: 400 }
      )
    }
    if (message.startsWith('PRODUCT_NOT_FOUND:')) {
      return NextResponse.json(
        { error: "Product not found", detail: message.split(':')[1] }, 
        { status: 400 }
      )
    }
    
    return NextResponse.json({ error: "Failed to create order", detail: message }, { status: 500 })
  } finally {
    if (client) {
      try {
        client.release()
      } catch (e) {
        console.error("Failed to release client:", e)
      }
    }
  }
}
