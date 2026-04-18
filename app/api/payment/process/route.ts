export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { createAuditLog, decryptCardNumber, decryptCvv } from "@/lib/payment-security"
import { securePaymentDatabase } from "@/lib/payment-database"
import { paymentProcessor } from "@/lib/payment-processor"
import crypto from "crypto"
import { requireSession } from "@/lib/auth-guard"

/**
 * Process payment with stored encrypted data
 * POST /api/payment/process
 */
export async function POST(request: NextRequest) {
  // Require authenticated session.
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  let body: { customerId?: string; paymentMethodId?: string; orderId?: string; amount?: string | number; currency?: string } = {}

  try {
    const parsedBody = await request.json()
    body = parsedBody
    const { customerId, paymentMethodId, amount, currency = "USD", orderId } = body

    // Validate required fields
    if (!customerId || !paymentMethodId || !amount || !orderId) {
      return NextResponse.json({ error: "Missing required payment data" }, { status: 400 })
    }

    // ── TEST MODE BYPASS ────────────────────────────────────────────────────
    // In non-production, skip the in-memory payment-method store (which resets
    // on every server hot-reload) and return an instant success response with a
    // fully-populated payment record.
    //
    // All required fields — transactionId, authorizationCode, amount, currency,
    // last4, brand — are generated here and returned to the caller so they can
    // be persisted normally by the orders layer.
    //
    // TODO: Remove this block before going live.
    if (process.env.NODE_ENV !== "production") {
      const testTransactionId = `txn_test_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
      const testAuthCode = Math.random().toString(36).substr(2, 8).toUpperCase()
      const parsedAmount = typeof amount === "number" ? amount : Number.parseFloat(amount as string)

      console.log(
        `[TEST MODE] /api/payment/process — auto-success for orderId=${orderId}, amount=${parsedAmount} ${currency}`
      )

      return NextResponse.json({
        success: true,
        transactionId: testTransactionId,
        authorizationCode: testAuthCode,
        amount: parsedAmount,
        currency,
        last4: "0000",       // masked — real card not decrypted in test mode
        brand: "test",
        processingTime: 500, // simulated ms
        riskScore: 1,
        testMode: true,
      })
    }
    // ── END TEST MODE BYPASS ────────────────────────────────────────────────

    // Prevent IDOR: non-admins can only process payments for themselves.
    if (session.role !== "admin" && session.userId !== customerId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Retrieve encrypted payment method
    const paymentMethod = await securePaymentDatabase.getPaymentMethod(paymentMethodId, request)
    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 })
    }

    // Verify customer ownership
    if (paymentMethod.customerId !== customerId) {
      return NextResponse.json({ error: "Unauthorized access to payment method" }, { status: 403 })
    }

    // Retrieve billing address
    const billingAddress = await securePaymentDatabase.getBillingAddress(paymentMethod.billingAddressId, request)
    if (!billingAddress) {
      return NextResponse.json({ error: "Billing address not found" }, { status: 404 })
    }

    // Decrypt payment data for processing
    let decryptedCardNumber: string
    let decryptedCvv: string

    try {
      decryptedCardNumber = decryptCardNumber(paymentMethod.encryptedCardNumber)
      const cvvData = decryptCvv(paymentMethod.encryptedCvv)
      decryptedCvv = cvvData.cvv

      // Create audit log for decryption
      const decryptAuditLog = createAuditLog(customerId, "DECRYPT", "CARD_DATA", paymentMethodId, request, true)
      await securePaymentDatabase.storeAuditLog(decryptAuditLog)
    } catch {
      // Create audit log for failed decryption
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

    // Process payment through mock processor
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
        phone: billingAddress.encryptedPhone ? "***-***-****" : undefined, // Don't decrypt phone for processing
      },
    })

    // Clear decrypted data from memory immediately
    decryptedCardNumber = ""
    decryptedCvv = ""

    if (!processorResponse.success) {
      // Create audit log for failed payment
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

    // Store transaction record
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
    if (!transactionStored) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to store transaction record")
      }
    }

    // Update payment method last used
    await securePaymentDatabase.updatePaymentMethod(paymentMethodId, { lastUsed: new Date() }, request)

    // Create success audit log
    const successAuditLog = createAuditLog(customerId, "CREATE", "PAYMENT_METHOD", paymentMethodId, request, true)
    await securePaymentDatabase.storeAuditLog(successAuditLog)

    // Return success response
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
      console.error("Payment processing error:", error)
    }

    // Create error audit log
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
      // Audit log failure should not interrupt error response
    }

    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 })
  }
}
