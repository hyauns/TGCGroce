export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { createAuditLog, decryptCardNumber, decryptCvv } from "@/lib/payment-security"
import { securePaymentDatabase } from "@/lib/payment-database"
import { paymentProcessor } from "@/lib/payment-processor"
import crypto from "crypto"

/**
 * Process payment with stored encrypted data
 * POST /api/payment/process
 */
export async function POST(request: NextRequest) {
  let body: { customerId?: string; paymentMethodId?: string; orderId?: string; amount?: string | number; currency?: string } = {}

  try {
    const parsedBody = await request.json()
    body = parsedBody
    const { customerId, paymentMethodId, amount, currency = "USD", orderId } = body

    // Validate required fields
    if (!customerId || !paymentMethodId || !amount || !orderId) {
      return NextResponse.json({ error: "Missing required payment data" }, { status: 400 })
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
