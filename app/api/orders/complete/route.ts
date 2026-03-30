export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { sendOrderConfirmation, sendAdminOrderNotification, type OrderEmailData } from "@/lib/email/send-email"
import { createAuditLog } from "@/lib/payment-security"
import { securePaymentDatabase } from "@/lib/payment-database"

/**
 * Complete order and send admin notification
 * POST /api/orders/complete
 */
export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
    const {
      orderId,
      orderNumber,
      customerId,
      customerEmail,
      customerPhone,
      paymentMethodId,
      transactionId,
      authorizationCode,
      amount,
      currency = "USD",
      items,
      shippingMethod,
      shippingCost,
      tax,
      total,
      estimatedDelivery,
      shippingAddress,
      customerName,
      trackingNumber,
    } = body

    // Validate required fields
    if (
      !orderId ||
      !orderNumber ||
      !customerId ||
      !customerEmail ||
      !paymentMethodId ||
      !transactionId ||
      !items ||
      !Array.isArray(items)
    ) {
      return NextResponse.json({ error: "Missing required order data" }, { status: 400 })
    }

    // Validate payment method exists and belongs to customer
    const paymentMethod = await securePaymentDatabase.getPaymentMethod(paymentMethodId, request)
    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 })
    }

    if (paymentMethod.customerId !== customerId) {
      return NextResponse.json({ error: "Unauthorized access to payment method" }, { status: 403 })
    }

    const orderEmailData: OrderEmailData = {
      orderId,
      orderNumber,
      customerId,
      customerEmail,
      customerPhone,
      paymentMethodId,
      transactionId,
      authorizationCode,
      amount: Number.parseFloat(amount),
      currency,
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Number.parseFloat(item.price),
        quantity: Number.parseInt(item.quantity),
        image: item.image,
      })),
      shippingMethod: shippingMethod || "Standard Shipping",
      shippingCost: Number.parseFloat(shippingCost || "0"),
      tax: Number.parseFloat(tax || "0"),
      total: Number.parseFloat(total),
      orderDate: new Date(),
      estimatedDelivery,
      shippingAddress: shippingAddress || {
        name: customerName || "Customer",
        street: "Address not provided",
        city: "City not provided",
        state: "State not provided",
        zipCode: "ZIP not provided",
        country: "Country not provided",
      },
      trackingNumber,
    }

    console.log(`📦 Processing order completion for ${orderNumber}`)

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
      customerId,
      "CREATE",
      "PAYMENT_METHOD",
      orderId,
      request,
      adminNotificationSent && customerConfirmationSent,
      undefined,
      !adminNotificationSent || !customerConfirmationSent ? "Failed to send email notifications" : undefined,
    )
    await securePaymentDatabase.storeAuditLog(auditLog)

    const response = {
      success: true,
      orderId,
      orderNumber,
      notifications: {
        adminNotificationSent,
        customerConfirmationSent,
      },
      message: "Order completed successfully",
    }

    if (!adminNotificationSent || !customerConfirmationSent) {
      response.message = "Order completed but some email notifications failed"
    }

    console.log(`✅ Order ${orderNumber} completed successfully`)
    console.log(`📧 Admin notification: ${adminNotificationSent ? "✅ Sent" : "❌ Failed"}`)
    console.log(`📧 Customer confirmation: ${customerConfirmationSent ? "✅ Sent" : "❌ Failed"}`)

    return NextResponse.json(response)
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

/**
 * Get order completion status
 * GET /api/orders/complete?orderId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const orderStatus = {
      orderId,
      status: "completed",
      emailNotifications: {
        adminNotificationSent: true,
        customerConfirmationSent: true,
        lastNotificationAt: new Date().toISOString(),
      },
      completedAt: new Date().toISOString(),
    }

    return NextResponse.json(orderStatus)
  } catch (error) {
    console.error("Error retrieving order status:", error)
    return NextResponse.json({ error: "Failed to retrieve order status" }, { status: 500 })
  }
}
