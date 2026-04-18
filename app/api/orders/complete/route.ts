export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify, sign } from "jsonwebtoken"
import { neon } from "@neondatabase/serverless"
import { sendOrderConfirmation, sendAdminOrderNotification, type OrderEmailData } from "@/lib/email/send-email"
import { createAuditLog } from "@/lib/payment-security"
import { securePaymentDatabase } from "@/lib/payment-database"

if (!process.env.JWT_SECRET) {
  throw new Error("[orders/complete] FATAL: JWT_SECRET is not set. Set it in your environment.")
}

const JWT_SECRET: string = process.env.JWT_SECRET
const sql = neon(process.env.DATABASE_URL!)
const GUEST_ORDER_COOKIE = "guest-order-token"

type SessionPayload = {
  userId: string
  email: string
  role: string
}

type OrderRow = {
  id: number
  order_number: string
  customer_id: string
  status: string
  payment_status: string
  subtotal: string
  tax_amount: string
  shipping_amount: string
  total_amount: string
  shipping_address: any
  billing_address: any
  tracking_number: string | null
  order_date: string | Date
  created_at: string | Date
  customer_email: string | null
  customer_user_id: string | null
  items: Array<{
    id: number
    product_id: string
    product_name: string
    quantity: number
    unit_price: string | number
    total_price: string | number
  }>
}

type GuestOrderTokenPayload = {
  orderId: string
  orderNumber: string
  customerId: string
  customerEmail: string
  type: "guest-order"
}

function getOptionalSession(): SessionPayload | null {
  try {
    const token = cookies().get("auth-token")?.value
    if (!token) return null
    return verify(token, JWT_SECRET) as SessionPayload
  } catch {
    return null
  }
}

function getGuestOrderToken(): GuestOrderTokenPayload | null {
  try {
    const token = cookies().get(GUEST_ORDER_COOKIE)?.value
    if (!token) return null
    return verify(token, JWT_SECRET) as GuestOrderTokenPayload
  } catch {
    return null
  }
}

async function getOrderByNumber(orderNumber: string): Promise<OrderRow | null> {
  const rows = await sql`
    SELECT
      o.id,
      o.order_number,
      o.customer_id,
      o.status,
      o.payment_status,
      o.subtotal,
      o.tax_amount,
      o.shipping_amount,
      o.total_amount,
      o.shipping_address,
      o.billing_address,
      o.tracking_number,
      o.order_date,
      o.created_at,
      c.email AS customer_email,
      c.user_id AS customer_user_id,
      COALESCE(
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
          )
          ORDER BY oi.id
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'::json
      ) AS items
    FROM orders o
    LEFT JOIN customers c ON c.id::text = o.customer_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.order_number = ${orderNumber}
    GROUP BY o.id, c.email, c.user_id
    LIMIT 1
  `

  return (rows[0] as OrderRow) || null
}

function isSuccessfulOrderStatus(status: string | null | undefined): boolean {
  const normalized = String(status || "").toLowerCase()
  return normalized === "completed" || normalized === "pending"
}

function parseAddress(address: unknown) {
  if (!address) return null

  const parsed = typeof address === "string" ? JSON.parse(address) : address
  if (!parsed || typeof parsed !== "object") return null

  const value = parsed as Record<string, string | null | undefined>
  const firstName = value.first_name ?? value.firstName ?? ""
  const lastName = value.last_name ?? value.lastName ?? ""

  return {
    name: `${firstName} ${lastName}`.trim() || "Customer",
    street: value.address_line1 ?? value.address1 ?? value.addressLine1 ?? "Address not provided",
    city: value.city ?? "City not provided",
    state: value.state ?? "State not provided",
    zipCode: value.postal_code ?? value.zipCode ?? value.postalCode ?? "ZIP not provided",
    country: value.country ?? "Country not provided",
  }
}

async function assertOrderAccess(order: OrderRow): Promise<NextResponse | null> {
  const session = getOptionalSession()

  if (session) {
    if (order.customer_user_id !== session.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    return null
  }

  const guestToken = getGuestOrderToken()
  if (
    !guestToken ||
    guestToken.type !== "guest-order" ||
    guestToken.orderNumber !== order.order_number ||
    guestToken.orderId !== String(order.id) ||
    guestToken.customerId !== order.customer_id ||
    guestToken.customerEmail !== (order.customer_email || "")
  ) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  return null
}

function buildOrderEmailData(order: OrderRow, body: any): OrderEmailData {
  const shippingAddress = parseAddress(order.shipping_address) || {
    name: body?.customerName || "Customer",
    street: "Address not provided",
    city: "City not provided",
    state: "State not provided",
    zipCode: "ZIP not provided",
    country: "Country not provided",
  }

  const estimatedDelivery =
    body?.estimatedDelivery ||
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US")

  return {
    orderId: String(order.id),
    orderNumber: order.order_number,
    customerId: order.customer_id,
    customerEmail: order.customer_email || body?.customerEmail || "",
    customerPhone: body?.customerPhone,
    paymentMethodId: body?.paymentMethodId || "",
    transactionId: body?.transactionId || `txn_${Date.now()}`,
    authorizationCode: body?.authorizationCode,
    amount: Number(order.subtotal),
    currency: body?.currency || "USD",
    items: (order.items || []).map((item) => ({
      id: String(item.product_id),
      name: item.product_name,
      price: Number(item.unit_price),
      quantity: Number(item.quantity),
      image: undefined,
    })),
    shippingMethod: body?.shippingMethod || "Standard Shipping",
    shippingCost: Number(order.shipping_amount),
    tax: Number(order.tax_amount),
    total: Number(order.total_amount),
    orderDate: new Date(order.order_date || order.created_at),
    estimatedDelivery,
    shippingAddress,
    trackingNumber: order.tracking_number || body?.trackingNumber,
  }
}

export async function POST(request: NextRequest) {
  let body: any

  try {
    body = await request.json()
    const { orderNumber, customerName, total } = body

    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 })
    }

    const order = await getOrderByNumber(orderNumber)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (!isSuccessfulOrderStatus(order.status)) {
      return NextResponse.json({ error: "Order is not ready for completion" }, { status: 400 })
    }

    const session = getOptionalSession()
    if (session) {
      if (order.customer_user_id !== session.userId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    } else {
      const bodyOrderId = body?.orderId ? String(body.orderId) : null
      const bodyCustomerEmail = String(body?.customerEmail || "").trim().toLowerCase()
      const orderCustomerEmail = String(order.customer_email || "").trim().toLowerCase()

      if (order.customer_user_id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      if (!bodyOrderId || bodyOrderId !== String(order.id)) {
        return NextResponse.json({ error: "Guest order validation failed" }, { status: 403 })
      }

      if (!bodyCustomerEmail || !orderCustomerEmail || bodyCustomerEmail !== orderCustomerEmail) {
        return NextResponse.json({ error: "Guest order validation failed" }, { status: 403 })
      }
    }

    const orderEmailData = buildOrderEmailData(order, body)

    if (!orderEmailData.customerEmail) {
      return NextResponse.json({ error: "Order email is unavailable" }, { status: 400 })
    }

    console.log(`📦 Processing order completion for ${order.order_number}`)

    let adminNotificationSent = false
    let customerConfirmationSent = false

    try {
      const adminResult = await sendAdminOrderNotification(
        orderEmailData,
        customerName,
        total > 500 ? "high" : "normal",
      )
      adminNotificationSent = adminResult.success

      if (!adminResult.success) {
        console.error("Admin notification failed:", adminResult.error)
      } else {
        console.log(`📧 Admin notification sent successfully. Message ID: ${adminResult.messageId}`)
      }
    } catch (error) {
      console.error("Admin notification error:", error)
    }

    try {
      const customerResult = await sendOrderConfirmation(orderEmailData, customerName)
      customerConfirmationSent = customerResult.success

      if (!customerResult.success) {
        console.error("Customer confirmation failed:", customerResult.error)
      } else {
        console.log(`📧 Customer confirmation sent successfully. Message ID: ${customerResult.messageId}`)
      }
    } catch (error) {
      console.error("Customer confirmation error:", error)
    }

    const auditLog = createAuditLog(
      order.customer_id,
      "CREATE",
      "PAYMENT_METHOD",
      String(order.id),
      request,
      adminNotificationSent && customerConfirmationSent,
      undefined,
      !adminNotificationSent || !customerConfirmationSent ? "Failed to send email notifications" : undefined,
    )
    await securePaymentDatabase.storeAuditLog(auditLog)

    const response = NextResponse.json({
      success: true,
      orderId: String(order.id),
      orderNumber: order.order_number,
      status: "completed",
      actualStatus: order.status,
      notifications: {
        adminNotificationSent,
        customerConfirmationSent,
      },
      message:
        !adminNotificationSent || !customerConfirmationSent
          ? "Order completed but some email notifications failed"
          : "Order completed successfully",
    })

    if (!session) {
      const guestToken = sign(
        {
          orderId: String(order.id),
          orderNumber: order.order_number,
          customerId: order.customer_id,
          customerEmail: order.customer_email || "",
          type: "guest-order",
        } satisfies GuestOrderTokenPayload,
        JWT_SECRET,
        { expiresIn: "2h" },
      )

      response.cookies.set(GUEST_ORDER_COOKIE, guestToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 2 * 60 * 60,
        path: "/",
      })
    }

    console.log(`✅ Order ${order.order_number} completed successfully`)
    console.log(`📧 Admin notification: ${adminNotificationSent ? "✅ Sent" : "❌ Failed"}`)
    console.log(`📧 Customer confirmation: ${customerConfirmationSent ? "✅ Sent" : "❌ Failed"}`)

    return response
  } catch (error) {
    console.error("❌ Order completion error:", error)

    try {
      const auditLog = createAuditLog(
        body?.customerId || "unknown",
        "CREATE",
        "PAYMENT_METHOD",
        body?.orderId || "unknown",
        request,
        false,
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      )
      await securePaymentDatabase.storeAuditLog(auditLog)
    } catch (auditError) {
      console.error("Audit log error:", auditError)
    }

    return NextResponse.json({ error: "Order completion failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get("orderNumber")

    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 })
    }

    const order = await getOrderByNumber(orderNumber)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const accessError = await assertOrderAccess(order)
    if (accessError) return accessError

    if (!isSuccessfulOrderStatus(order.status)) {
      return NextResponse.json({ error: "Order is not complete" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      order: {
        id: String(order.id),
        orderNumber: order.order_number,
        status: "completed",
        actualStatus: order.status,
        paymentStatus: order.payment_status,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax_amount),
        shipping: Number(order.shipping_amount),
        total: Number(order.total_amount),
        customerEmail: order.customer_email,
        orderDate: order.order_date,
        createdAt: order.created_at,
        trackingNumber: order.tracking_number,
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US"),
        items: (order.items || []).map((item) => ({
          id: String(item.id),
          productId: item.product_id,
          productName: item.product_name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
          totalPrice: Number(item.total_price),
        })),
      },
      emailNotifications: {
        adminNotificationSent: true,
        customerConfirmationSent: true,
      },
    })
  } catch (error) {
    console.error("Error retrieving order status:", error)
    return NextResponse.json({ error: "Failed to retrieve order status" }, { status: 500 })
  }
}
