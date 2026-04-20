export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import {
  encryptCardNumber,
  encryptCvv,
  encryptPhone,
  createHash,
  detectCardBrand,
  validatePaymentData,
  createAuditLog,
} from "@/lib/payment-security"
import { securePaymentDatabase } from "@/lib/payment-database"
import crypto from "crypto"
import { requireSession } from "@/lib/auth-guard"

/**
 * Store encrypted payment method securely
 * POST /api/payment/store
 */
export async function POST(request: NextRequest) {
  // Require authenticated session — payment method storage is a sensitive operation.
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  let body: Record<string, unknown> = {}

  try {
    const parsedBody = await request.json()
    body = parsedBody
    const { customerId, cardNumber, expiryMonth, expiryYear, cvv, nameOnCard, billingAddress, isDefault = false } = parsedBody as {
      customerId?: string;
      cardNumber?: string;
      expiryMonth?: string | number;
      expiryYear?: string | number;
      cvv?: string;
      nameOnCard?: string;
      billingAddress?: unknown;
      isDefault?: boolean;
    }

    // Validate required fields
    if (!customerId || !cardNumber || !expiryMonth || !expiryYear || !cvv || !billingAddress) {
      return NextResponse.json({ error: "Missing required payment data" }, { status: 400 })
    }

    // Prevent IDOR: non-admins can only store payment methods for themselves.
    if (session.role !== "admin" && session.userId !== customerId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Validate payment data (format only - length, digits, expiry, CVV length)
    const validation = validatePaymentData({
      cardNumber,
      expiryMonth: typeof expiryMonth === "string" ? Number.parseInt(expiryMonth) : expiryMonth,
      expiryYear: typeof expiryYear === "string" ? Number.parseInt(expiryYear) : expiryYear,
      cvv,
    })

    // TEMPORARY FOR TESTING ONLY — Bypass card validity (Luhn / BIN) check.
    // Only reject if the card number format is completely wrong (wrong length / non-numeric).
    // TODO: Remove this block after Paygate testing and restore the original check below:
    //   if (!validation.isValid) {
    //     return NextResponse.json({ error: validation.errors.join(", ") }, { status: 400 })
    //   }
    const formatErrors = validation.errors.filter(
      (e) => e === "Invalid card number length"
    )
    if (formatErrors.length > 0) {
      return NextResponse.json({ error: formatErrors.join(", ") }, { status: 400 })
    }
    // END TEMPORARY BLOCK

    // Clean and validate card number
    const cleanCardNumber = cardNumber.replace(/\D/g, "")
    const cardBrand = detectCardBrand(cleanCardNumber)
    const last4 = cleanCardNumber.slice(-4)

    const billingAddr = billingAddress as {
      phone?: string;
      firstName?: string;
      lastName?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    }

    // Encrypt sensitive data
    const encryptedCardNumber = encryptCardNumber(cleanCardNumber)
    const encryptedCvv = encryptCvv(cvv)
    const encryptedPhone = billingAddr.phone ? encryptPhone(billingAddr.phone) : undefined

    // Create hashes for duplicate detection
    const cardNumberHash = createHash(cleanCardNumber)
    const cvvHash = createHash(cvv)

    // Store billing address first
    const billingAddressId = crypto.randomUUID()
    const secureBillingAddress = {
      id: billingAddressId,
      customerId,
      firstName: billingAddr.firstName || "",
      lastName: billingAddr.lastName || "",
      addressLine1: billingAddr.addressLine1 || "",
      addressLine2: billingAddr.addressLine2,
      city: billingAddr.city || "",
      state: billingAddr.state || "",
      postalCode: billingAddr.postalCode || "",
      country: billingAddr.country || "United States",
      encryptedPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const billingStored = await securePaymentDatabase.storeBillingAddress(secureBillingAddress, request)
    if (!billingStored) {
      throw new Error("Failed to store billing address")
    }

    // Store encrypted payment method
    const paymentMethodId = crypto.randomUUID()
    const encryptedPaymentMethod = {
      id: paymentMethodId,
      customerId,
      encryptedCardNumber,
      cardNumberHash,
      last4,
      brand: cardBrand,
      expiryMonth: typeof expiryMonth === "string" ? Number.parseInt(expiryMonth) : expiryMonth,
      expiryYear: typeof expiryYear === "string" ? Number.parseInt(expiryYear) : expiryYear,
      encryptedCvv,
      cvvHash,
      billingAddressId,
      isDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const paymentStored = await securePaymentDatabase.storePaymentMethod(encryptedPaymentMethod, request)
    if (!paymentStored) {
      throw new Error("Failed to store payment method")
    }

    // Clear sensitive data from memory
    body.cardNumber = ""
    body.cvv = ""

    // Return success response (without sensitive data)
    return NextResponse.json({
      success: true,
      paymentMethodId,
      billingAddressId,
      last4,
      brand: cardBrand,
      expiryMonth: typeof expiryMonth === "string" ? Number.parseInt(expiryMonth) : expiryMonth,
      expiryYear: typeof expiryYear === "string" ? Number.parseInt(expiryYear) : expiryYear,
      isDefault,
      message: "Payment method stored securely",
    })
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error storing payment method")
    }

    // Create error audit log
    try {
      const auditLog = createAuditLog(
        (body.customerId as string) || "unknown",
        "CREATE",
        "PAYMENT_METHOD",
        "failed",
        request,
        false,
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      )
      await securePaymentDatabase.storeAuditLog(auditLog)
    } catch {
      // Audit log failure should not interrupt error response
    }

    return NextResponse.json({ error: "Failed to store payment method" }, { status: 500 })
  }
}
