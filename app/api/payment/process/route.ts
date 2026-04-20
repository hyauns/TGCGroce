export const dynamic = "force-dynamic"

import crypto from "crypto"
import { type NextRequest, NextResponse } from "next/server"
import { createAuditLog, decryptCardNumber, decryptCvv } from "@/lib/payment-security"
import { securePaymentDatabase } from "@/lib/payment-database"
import { paymentProcessor } from "@/lib/payment-processor"
import { requireSession } from "@/lib/auth-guard"

function isStoredPaymentTestModeEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.PAYMENT_TEST_MODE === "true"
}

/**
 * Process payment with stored encrypted data
 * POST /api/payment/process
 */
export async function POST(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  let body: { customerId?: string; paymentMethodId?: string; orderId?: string; amount?: string | number; currency?: string } = {}

  try {
    const parsedBody = await request.json()
    body = parsedBody
    const { customerId, paymentMethodId, amount, currency = "USD", orderId } = body

    if (!customerId || !paymentMethodId || !amount || !orderId) {
      return NextResponse.json({ error: "Missing required payment data" }, { status: 400 })
    }

    if (session.role !== "admin" && session.userId !== customerId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (!isStoredPaymentTestModeEnabled()) {
      return NextResponse.json(
        { error: "Stored payment processing is not enabled in this environment" },
        { status: 503 },
      )
    }

    const paymentMethod = await securePaymentDatabase.getPaymentMethod(paymentMethodId, request)
    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 })
    }

    if (paymentMethod.customerId !== customerId) {
      return NextResponse.json({ error: "Unauthorized access to payment method" }, { status: 403 })
    }

    const billingAddress = await securePaymentDatabase.getBillingAddress(paymentMethod.billingAddressId, request)
    if (!billingAddress) {
      return NextResponse.json({ error: "Billing address not found" }, { status: 404 })
    }

    let decryptedCardNumber = ""
    let decryptedCvv = ""

    try {
      decryptedCardNumber = decryptCardNumber(paymentMethod.encryptedCardNumber)
      const cvvData = decryptCvv(paymentMethod.encryptedCvv)
      decryptedCvv = cvvData.cvv

      const decryptAuditLog = createAuditLog(customerId, "DECRYPT", "CARD_DATA", paymentMethodId, request, true)
      await securePaymentDatabase.storeAuditLog(decryptAuditLog)
    } catch {
      const decryptAuditLog = createAuditLog(
        customerId,
        "DECRYPT",
        "CARD_DATA",
        paymentMethodId,
        request,
        false,
        undefined,
        "Failed to decrypt payment data",
      )
      await securePaymentDatabase.storeAuditLog(decryptAuditLog)

      return NextResponse.json({ error: "Failed to process payment method" }, { status: 500 })
    }

    const processorResponse = await paymentProcessor.processPayment({
      cardNumber: decryptedCardNumber,
      expiryMonth: paymentMethod.expiryMonth,
      expiryYear: paymentMethod.expiryYear,
      cvv: decryptedCvv,
      billingDetails: {
        name: `${billingAddress.firstName} ${billingAddress.lastName}`,
        address: {
          line1: billingAddress.addressLine1,
          line2: billingAddress.addressLine2,
          city: billingAddress.city,
          state: billingAddress.state,
          postal_code: billingAddress.postalCode,
          country: billingAddress.country,
        },
        phone: billingAddress.encryptedPhone ? "***-***-****" : undefined,
      },
    })

    decryptedCardNumber = ""
    decryptedCvv = ""

    if (!processorResponse.success) {
      const paymentAuditLog = createAuditLog(
        customerId,
        "CREATE",
        "PAYMENT_METHOD",
        paymentMethodId,
        request,
        false,
        undefined,
        processorResponse.errorMessage || "Payment processing failed",
      )
      await securePaymentDatabase.storeAuditLog(paymentAuditLog)

      return NextResponse.json(
        {
          success: false,
          error: processorResponse.errorMessage || "Payment processing failed",
          transactionId: processorResponse.transactionId,
        },
        { status: 400 },
      )
    }

    const transactionRecord = {
      id: crypto.randomUUID(),
      customerId,
      paymentMethodId,
      orderId,
      transactionId: processorResponse.transactionId,
      authorizationCode: processorResponse.authorizationCode,
      amount: typeof amount === "number" ? amount : Number.parseFloat(amount as string),
      currency,
      status: "succeeded" as const,
      gatewayResponse: {
        processingTime: processorResponse.processingTime,
        riskScore: processorResponse.riskScore,
        last4: processorResponse.last4,
        brand: processorResponse.brand,
      },
      riskScore: processorResponse.riskScore,
      processedAt: new Date(),
    }

    const transactionStored = await securePaymentDatabase.storeTransaction(transactionRecord, request)
    if (!transactionStored && process.env.NODE_ENV !== "production") {
      console.error("Failed to store transaction record")
    }

    await securePaymentDatabase.updatePaymentMethod(paymentMethodId, { lastUsed: new Date() }, request)

    const successAuditLog = createAuditLog(customerId, "CREATE", "PAYMENT_METHOD", paymentMethodId, request, true)
    await securePaymentDatabase.storeAuditLog(successAuditLog)

    return NextResponse.json({
      success: true,
      transactionId: processorResponse.transactionId,
      authorizationCode: processorResponse.authorizationCode,
      amount: typeof amount === "number" ? amount : Number.parseFloat(amount as string),
      currency,
      last4: processorResponse.last4,
      brand: processorResponse.brand,
      processingTime: processorResponse.processingTime,
      riskScore: processorResponse.riskScore,
    })
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Payment processing error")
    }

    try {
      const auditLog = createAuditLog(
        body?.customerId || "unknown",
        "CREATE",
        "PAYMENT_METHOD",
        body?.paymentMethodId || "unknown",
        request,
        false,
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      )
      await securePaymentDatabase.storeAuditLog(auditLog)
    } catch {
      // Audit log failure should not interrupt error response.
    }

    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 })
  }
}
