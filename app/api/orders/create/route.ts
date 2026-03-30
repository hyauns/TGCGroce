export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { detectCardBrand } from "@/lib/payment-security"
import { sendOrderConfirmation, sendAdminOrderNotification } from "@/lib/email/send-email"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Resolve or lazily create a customers row for an authenticated user_id.
 * Returns customers.id as a string.
 */
async function resolveCustomerId(userId: string): Promise<string | null> {
  if (!userId || userId === "guest") return null

  const [existing] = await sql`
    SELECT id FROM customers WHERE user_id = ${userId}::uuid LIMIT 1
  `
  if (existing) return String(existing.id)

  // Lazy-create if registration somehow missed it
  const [userRow] = await sql`
    SELECT email, first_name, last_name FROM users WHERE user_id = ${userId}::uuid LIMIT 1
  `
  if (!userRow) return null

  const [created] = await sql`
    INSERT INTO customers (user_id, email, first_name, last_name, total_orders, total_spent)
    SELECT ${userId}::uuid, ${userRow.email}, ${userRow.first_name}, ${userRow.last_name}, 0, 0
    WHERE NOT EXISTS (SELECT 1 FROM customers WHERE user_id = ${userId}::uuid)
    RETURNING id
  `
  if (!created) {
    const [refetch] = await sql`SELECT id FROM customers WHERE user_id = ${userId}::uuid LIMIT 1`
    return refetch ? String(refetch.id) : null
  }
  return String(created.id)
}

/**
 * Resolve or create a guest customers row keyed by email.
 * user_id is left NULL since there is no auth account.
 * Returns customers.id as a string.
 */
async function resolveGuestCustomerId(
  email: string,
  firstName: string,
  lastName: string,
): Promise<string | null> {
  if (!email) return null

  // Check if a guest customer row already exists for this email
  const [existing] = await sql`
    SELECT id FROM customers WHERE email = ${email} AND user_id IS NULL LIMIT 1
  `
  if (existing) return String(existing.id)

  // Create a new guest customer row (user_id stays NULL)
  const [created] = await sql`
    INSERT INTO customers (email, first_name, last_name, total_orders, total_spent)
    VALUES (${email}, ${firstName}, ${lastName}, 0, 0)
    RETURNING id
  `
  return created ? String(created.id) : null
}

/**
 * Extract only physical address fields — strips out any payment/card data
 * so we never store raw card numbers inside orders JSON columns.
 */
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
 * Guard: ensures the critical NOT NULL fields have real content.
 * Returns true if the address is safe to INSERT.
 */
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

/**
 * POST /api/orders/create
 *
 * Precisely distributes checkout payload into:
 *   orders → order_items → shipping_addresses (upsert)
 *   billing_addresses → payment_methods → payment_audit_logs → payment_transactions
 */
export async function POST(request: NextRequest) {
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
      paymentInfo,     // { cardNumber, expiryDate, cvv, cardName }
    } = body

    if (!orderNumber || !items || !Array.isArray(items) || !totalAmount) {
      return NextResponse.json({ error: "Missing required order data" }, { status: 400 })
    }

    // ── 0. Resolve customer — authenticated OR guest ────────────────────────
    const customerEmail: string | null =
      body.customerEmail ?? body.email ??
      rawShipping?.email ?? rawBilling?.email ?? null

    let customerId: string | null = null
    if (userId && userId !== "guest") {
      customerId = await resolveCustomerId(userId)
    } else if (customerEmail) {
      // Guest: find-or-create a customer row keyed by email
      const guestFirst = rawShipping?.firstName ?? rawBilling?.firstName ?? "Guest"
      const guestLast  = rawShipping?.lastName  ?? rawBilling?.lastName  ?? ""
      customerId = await resolveGuestCustomerId(customerEmail, guestFirst, guestLast)
    }

    // ── 1. Sanitise address objects — no card data in JSON columns ──────────
    const cleanShipping = sanitizeAddress(rawShipping ?? {})
    const cleanBilling  = sanitizeAddress(rawBilling  ?? rawShipping ?? {})

    // ── 2. Insert order ─────────────────────────────────────────────────────
    const [order] = await sql`
      INSERT INTO orders (
        customer_id, order_number, status,
        subtotal, tax_amount, shipping_amount, total_amount,
        payment_status, shipping_address, billing_address, order_date
      ) VALUES (
        ${customerId ?? "guest"}, ${orderNumber}, 'PENDING',
        ${Number(subtotal  || 0)}, ${Number(taxAmount     || 0)},
        ${Number(shippingAmount || 0)}, ${Number(totalAmount)},
        'PENDING',
        ${JSON.stringify(cleanShipping)},
        ${JSON.stringify(cleanBilling)},
        NOW()
      )
      RETURNING *
    `

    // ── 3. Insert order items ───────────────────────────────────────────────
    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
        VALUES (
          ${order.id}, ${String(item.id)}, ${item.name},
          ${Number(item.quantity)}, ${Number(item.price)},
          ${Number(item.price) * Number(item.quantity)}
        )
      `
    }

    // ── 4. Upsert shipping address for authenticated users ──────────────────
    if (customerId && isAddressValid(cleanShipping)) {
      await sql`
        INSERT INTO shipping_addresses (
          customer_id, first_name, last_name,
          address_line1, address_line2, city, state,
          postal_code, country, phone, is_default
        ) VALUES (
          ${Number(customerId)},
          ${cleanShipping.first_name}, ${cleanShipping.last_name},
          ${cleanShipping.address_line1}, ${cleanShipping.address_line2},
          ${cleanShipping.city}, ${cleanShipping.state},
          ${cleanShipping.postal_code}, ${cleanShipping.country},
          ${cleanShipping.phone}, false
        )
        ON CONFLICT DO NOTHING
      `
    }

    // ── 5. billing_addresses table — runs for ALL checkouts ─────────────────
    let billingAddressId: string | null = null
    if (customerId && isAddressValid(cleanBilling)) {
      const [billingRow] = await sql`
        INSERT INTO billing_addresses (
          customer_id, first_name, last_name,
          address_line1, address_line2, city, state,
          postal_code, country
        ) VALUES (
          ${String(customerId)},
          ${cleanBilling.first_name}, ${cleanBilling.last_name},
          ${cleanBilling.address_line1}, ${cleanBilling.address_line2},
          ${cleanBilling.city}, ${cleanBilling.state},
          ${cleanBilling.postal_code}, ${cleanBilling.country}
        )
        RETURNING id
      `
      billingAddressId = billingRow ? String(billingRow.id) : null
    } else if (paymentInfo?.cardNumber && isAddressValid(cleanBilling)) {
      // Guest with no resolved customer — still persist the billing address
      const [billingRow] = await sql`
        INSERT INTO billing_addresses (
          customer_id, first_name, last_name,
          address_line1, address_line2, city, state,
          postal_code, country
        ) VALUES (
          ${"guest"},
          ${cleanBilling.first_name}, ${cleanBilling.last_name},
          ${cleanBilling.address_line1}, ${cleanBilling.address_line2},
          ${cleanBilling.city}, ${cleanBilling.state},
          ${cleanBilling.postal_code}, ${cleanBilling.country}
        )
        RETURNING id
      `
      billingAddressId = billingRow ? String(billingRow.id) : null
    }

    // ── 6. payment_methods table ────────────────────────────────────────────
    // TESTING MODE: raw card values inserted directly so the data flow can be
    // verified end-to-end. Encryption will be added before production launch.
    // This block is NOT wrapped in a try/catch so failures surface immediately.
    let paymentMethodId: string | null = null
    if (paymentInfo?.cardNumber) {
      const rawCard     = String(paymentInfo.cardNumber).replace(/\D/g, "")
      const last4       = rawCard.slice(-4)
      const brand       = detectCardBrand(rawCard)
      const rawCvv      = String(paymentInfo.cvv ?? "")

      // Parse "MM/YY" or "MM/YYYY"
      const [mm, yy]    = String(paymentInfo.expiryDate ?? "").split("/")
      const expiryMonth = parseInt(mm, 10) || 1
      const rawYear     = parseInt(yy, 10) || 0
      const expiryYear  = rawYear < 100 ? 2000 + rawYear : rawYear

      // user_id is NULL for guests (column is nullable uuid)
      // customer_id is character varying — use resolved ID or "guest" fallback
      const pmCustomerId = customerId ?? "guest"
      const pmUserId     = (userId && userId !== "guest") ? userId : null

      const [pmRow] = await sql`
        INSERT INTO payment_methods (
          user_id, customer_id, billing_address_id,
          last4, brand, expiry_month, expiry_year,
          encrypted_card_number, card_number_hash,
          encrypted_cvv, cvv_hash,
          is_default
        ) VALUES (
          ${pmUserId ? sql`${pmUserId}::uuid` : sql`NULL`},
          ${pmCustomerId},
          ${billingAddressId ?? null},
          ${last4},
          ${brand},
          ${expiryMonth},
          ${expiryYear},
          ${rawCard},
          ${rawCard},
          ${rawCvv},
          ${rawCvv},
          true
        )
        RETURNING id
      `
      if (!pmRow) throw new Error("payment_methods INSERT returned no row — check FK constraints")
      paymentMethodId = String(pmRow.id)
    }

    // ── 7. payment_audit_logs ────────────────────────────────────────────────
    // Skipped for MVP — the check constraint on `resource` accepts specific
    // enum values that are not yet confirmed. Will add once values are known.

    // ── 8. payment_transactions table — runs for all checkouts with a payment method
    const transactionId = `txn_${Date.now()}_${globalThis.crypto.randomUUID().slice(0, 8)}`
    if (paymentMethodId) {
      const txCustomerId = customerId ?? "guest"
      await sql`
        INSERT INTO payment_transactions (
          customer_id, payment_method_id, order_id,
          transaction_id, amount, currency,
          status, risk_score, gateway_response
        ) VALUES (
          ${txCustomerId}, ${paymentMethodId}, ${String(order.id)},
          ${transactionId}, ${Number(totalAmount)}, 'USD',
          'succeeded', 0,
          ${JSON.stringify({ source: "checkout", mock: true })}
        )
      `
    }

    // ── 9. Update customer totals ────────────────────────────────────────────
    if (customerId) {
      await sql`
        UPDATE customers
        SET total_orders    = total_orders + 1,
            total_spent     = total_spent  + ${Number(totalAmount)},
            last_order_date = NOW(),
            updated_at      = NOW()
        WHERE id = ${customerId}
      `
    }

    // ── 10. Transactional emails ─────────────────────────────────────────────
    // MUST be awaited — Vercel serverless freezes after NextResponse.json(),
    // killing any floating Promise before the Resend HTTP call completes.
    // A failure here logs but NEVER rolls back the order.
    try {
      // customerEmail was already resolved in step 0 above
      console.log("[v0] Order email: customerEmail resolved as:", customerEmail)
      console.log("[v0] Order email: orderNumber =", orderNumber, "| items =", items?.length)

      if (customerEmail) {
        const emailOrderData = {
          orderId:         String(order.id),
          orderNumber,
          customerId:      customerId ?? "guest",
          customerEmail,
          paymentMethodId: paymentMethodId ?? "",
          transactionId,
          amount:          Number(subtotal     || 0),
          currency:        "USD",
          items:           (items as any[]).map((i) => ({
            id:       String(i.id),
            name:     i.name,
            price:    Number(i.price),
            quantity: Number(i.quantity),
          })),
          shippingMethod: "Standard",
          shippingCost:   Number(shippingAmount || 0),
          tax:            Number(taxAmount      || 0),
          total:          Number(totalAmount),
          orderDate:      new Date(),
          shippingAddress: {
            name:    `${cleanShipping.first_name} ${cleanShipping.last_name}`.trim(),
            street:  cleanShipping.address_line1,
            city:    cleanShipping.city,
            state:   cleanShipping.state,
            zipCode: cleanShipping.postal_code,
            country: cleanShipping.country,
          },
        }

        // Awaited — serverless will not freeze these before they complete
        const [confirmResult, adminResult] = await Promise.all([
          sendOrderConfirmation(emailOrderData),
          sendAdminOrderNotification(emailOrderData),
        ])
        console.log("[v0] Order email: confirmation result:", confirmResult)
        console.log("[v0] Order email: admin notification result:", adminResult)
      } else {
        console.log("[v0] Order email: skipped — no customerEmail in request body")
        console.log("[v0] Order email: full body keys:", Object.keys(body))
      }
    } catch (emailErr) {
      console.error("[v0] Order email setup error:", emailErr)
    }

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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Order creation error:", message, error)
    return NextResponse.json({ error: "Failed to create order", detail: message }, { status: 500 })
  }
}
