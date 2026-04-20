/**
 * Development-only payment processor harness.
 * This must never be reachable in production.
 */

export interface PaymentProcessorRequest {
  cardNumber: string
  expiryMonth: number
  expiryYear: number
  cvv: string
  billingDetails: {
    name: string
    address: {
      line1: string
      line2?: string
      city: string
      state: string
      postal_code: string
      country: string
    }
    phone?: string
  }
}

export interface PaymentProcessorResponse {
  success: boolean
  transactionId: string
  authorizationCode: string
  last4: string
  brand: string
  expiryMonth: number
  expiryYear: number
  billingDetails: {
    name: string
    address: {
      line1: string
      line2?: string
      city: string
      state: string
      postal_code: string
      country: string
    }
    phone?: string
  }
  processingTime: number
  riskScore: number
  errorMessage?: string
}

function isPaymentTestModeEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.PAYMENT_TEST_MODE === "true"
}

function assertPaymentTestMode(): void {
  if (!isPaymentTestModeEnabled()) {
    throw new Error("Test payment processor is disabled")
  }
}

class TestPaymentProcessor {
  async processPayment(request: PaymentProcessorRequest): Promise<PaymentProcessorResponse> {
    assertPaymentTestMode()

    const startTime = Date.now()

    try {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500))

      const cleanCardNumber = request.cardNumber.replace(/\D/g, "")
      const last4 = cleanCardNumber.slice(-4)
      const brand = this.detectCardBrand(cleanCardNumber)
      const testScenario = this.getTestScenario(cleanCardNumber)

      if (!testScenario.success) {
        return {
          success: false,
          transactionId: "",
          authorizationCode: "",
          last4,
          brand,
          expiryMonth: request.expiryMonth,
          expiryYear: request.expiryYear,
          billingDetails: request.billingDetails,
          processingTime: Date.now() - startTime,
          riskScore: testScenario.riskScore,
          errorMessage: testScenario.errorMessage,
        }
      }

      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
      const authorizationCode = Math.random().toString(36).slice(2, 10).toUpperCase()

      return {
        success: true,
        transactionId,
        authorizationCode,
        last4,
        brand,
        expiryMonth: request.expiryMonth,
        expiryYear: request.expiryYear,
        billingDetails: request.billingDetails,
        processingTime: Date.now() - startTime,
        riskScore: testScenario.riskScore,
      }
    } catch (error) {
      console.error("Test payment processing error:", error)

      return {
        success: false,
        transactionId: "",
        authorizationCode: "",
        last4: request.cardNumber.slice(-4),
        brand: "unknown",
        expiryMonth: request.expiryMonth,
        expiryYear: request.expiryYear,
        billingDetails: request.billingDetails,
        processingTime: Date.now() - startTime,
        riskScore: 10,
        errorMessage: "Payment processing failed",
      }
    }
  }

  async createPaymentMethod(request: PaymentProcessorRequest): Promise<PaymentProcessorResponse> {
    assertPaymentTestMode()
    return this.processPayment(request)
  }

  private detectCardBrand(cardNumber: string): string {
    const digits = cardNumber.replace(/\D/g, "")

    if (/^4/.test(digits)) return "visa"
    if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard"
    if (/^3[47]/.test(digits)) return "amex"
    if (/^6011/.test(digits) || /^622[1-9]/.test(digits) || /^64[4-9]/.test(digits) || /^65/.test(digits)) {
      return "discover"
    }

    return "unknown"
  }

  private getTestScenario(cardNumber: string): { success: boolean; riskScore: number; errorMessage?: string } {
    const last4 = cardNumber.slice(-4)

    switch (last4) {
      case "0001":
        return { success: false, riskScore: 8, errorMessage: "Card declined by issuer" }
      case "0002":
        return { success: false, riskScore: 3, errorMessage: "Insufficient funds" }
      case "0003":
        return { success: false, riskScore: 2, errorMessage: "Card expired" }
      case "0004":
        return { success: false, riskScore: 5, errorMessage: "Invalid CVV" }
      case "0005":
        return { success: true, riskScore: 9 }
      case "0006":
        return { success: true, riskScore: 5 }
      default:
        return { success: true, riskScore: Math.floor(Math.random() * 3) + 1 }
    }
  }

  async validatePaymentMethod(request: PaymentProcessorRequest): Promise<{ valid: boolean; errors: string[] }> {
    assertPaymentTestMode()

    const errors: string[] = []
    const cleanCardNumber = request.cardNumber.replace(/\D/g, "")

    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      errors.push("Invalid card number length")
    }

    if (request.expiryMonth < 1 || request.expiryMonth > 12) {
      errors.push("Invalid expiry month")
    }

    const currentYear = new Date().getFullYear()
    if (request.expiryYear < currentYear) {
      errors.push("Card has expired")
    }

    if (!request.cvv || request.cvv.length < 3 || request.cvv.length > 4) {
      errors.push("Invalid CVV")
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

export const paymentProcessor = new TestPaymentProcessor()
