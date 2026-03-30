export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { securePaymentDatabase } from "@/lib/payment-database"
import { emailService } from "@/lib/email-service"
import {
  encryptCardNumber,
  encryptCvv,
  encryptPhone,
  createHash,
  detectCardBrand,
  validatePaymentData,
  decryptCardNumber,
  decryptCvv,
  decryptPhone,
} from "@/lib/payment-security"

/**
 * Test payment data storage and email notifications
 * POST /api/payment/test
 */
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("Starting comprehensive payment system test...")
    }

    const testResults = {
      timestamp: new Date().toISOString(),
      tests: [] as Array<{
        name: string
        status: "PASS" | "FAIL"
        details: string
        duration: number
      }>,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
      },
    }

    // Test 1: Database Storage Test
    const test1Start = Date.now()
    try {
      // Create test customer data
      const customerId = `test-customer-${Date.now()}`
      const testCardNumber = "4532015112830366" // Test Visa card
      const testCvv = "123"
      const testPhone = "+1-555-123-4567"

      // Encrypt payment data
      const encryptedCardNumber = encryptCardNumber(testCardNumber)
      const encryptedCvv = encryptCvv(testCvv)
      const encryptedPhone = encryptPhone(testPhone)

      // Create billing address
      const billingAddressId = crypto.randomUUID()
      const billingAddress = {
        id: billingAddressId,
        customerId,
        firstName: "John",
        lastName: "Doe",
        addressLine1: "123 Test Street",
        addressLine2: "Apt 4B",
        city: "Test City",
        state: "CA",
        postalCode: "90210",
        country: "United States",
        encryptedPhone,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Store billing address
      const billingStored = await securePaymentDatabase.storeBillingAddress(billingAddress, request)
      if (!billingStored) throw new Error("Failed to store billing address")

      // Create payment method
      const paymentMethodId = crypto.randomUUID()
      const paymentMethod = {
        id: paymentMethodId,
        customerId,
        encryptedCardNumber,
        cardNumberHash: createHash(testCardNumber),
        last4: testCardNumber.slice(-4),
        brand: detectCardBrand(testCardNumber),
        expiryMonth: 12,
        expiryYear: 2025,
        encryptedCvv,
        cvvHash: createHash(testCvv),
        billingAddressId,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Store payment method
      const paymentStored = await securePaymentDatabase.storePaymentMethod(paymentMethod, request)
      if (!paymentStored) throw new Error("Failed to store payment method")

      testResults.tests.push({
        name: "Database Storage Test",
        status: "PASS",
        details: `Successfully stored payment method ${paymentMethodId} and billing address ${billingAddressId}`,
        duration: Date.now() - test1Start,
      })
    } catch (error) {
      testResults.tests.push({
        name: "Database Storage Test",
        status: "FAIL",
        details: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - test1Start,
      })
    }

    // Test 2: Data Retrieval Test
    const test2Start = Date.now()
    try {
      const customerId = `test-customer-${Date.now() - 1000}` // Use previous customer
      const paymentMethods = await securePaymentDatabase.getCustomerPaymentMethods(customerId, request)

      if (paymentMethods.length === 0) {
        throw new Error("No payment methods found for test customer")
      }

      const paymentMethod = paymentMethods[0]
      const billingAddress = await securePaymentDatabase.getBillingAddress(paymentMethod.billingAddressId, request)

      if (!billingAddress) {
        throw new Error("Billing address not found")
      }

      testResults.tests.push({
        name: "Data Retrieval Test",
        status: "PASS",
        details: `Successfully retrieved ${paymentMethods.length} payment methods and billing address`,
        duration: Date.now() - test2Start,
      })
    } catch (error) {
      testResults.tests.push({
        name: "Data Retrieval Test",
        status: "FAIL",
        details: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - test2Start,
      })
    }

    // Test 3: Email Notification Test
    const test3Start = Date.now()
    try {
      const testOrderData = {
        orderId: `test-order-${Date.now()}`,
        orderNumber: `TCG-TEST-${Date.now()}`,
        customerId: `test-customer-${Date.now()}`,
        customerEmail: "test@example.com",
        customerPhone: "+1-555-123-4567",
        paymentMethodId: crypto.randomUUID(),
        transactionId: `txn_test_${Date.now()}`,
        authorizationCode: "AUTH123",
        amount: 99.99,
        currency: "USD",
        items: [
          {
            id: "item1",
            name: "Test Trading Card Pack",
            price: 49.99,
            quantity: 2,
            image: "/test-image.jpg",
          },
        ],
        shippingMethod: "Standard Shipping",
        shippingCost: 9.99,
        tax: 8.0,
        total: 107.98,
        orderDate: new Date(),
        estimatedDelivery: "5-7 business days",
        shippingAddress: {
          name: "John Smith",
          street: "123 Test Street, Apt 4B",
          city: "Test City",
          state: "CA",
          zipCode: "90210",
          country: "United States",
        },
      }

      // Create test payment method for email test
      const testCardNumber = "4532015112830366"
      const testCvv = "123"
      const encryptedCardNumber = encryptCardNumber(testCardNumber)
      const encryptedCvv = encryptCvv(testCvv)

      const billingAddressId = crypto.randomUUID()
      const testBillingAddress = {
        id: billingAddressId,
        customerId: testOrderData.customerId,
        firstName: "Jane",
        lastName: "Smith",
        addressLine1: "456 Email Test Ave",
        city: "Email City",
        state: "NY",
        postalCode: "10001",
        country: "United States",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const testPaymentMethod = {
        id: testOrderData.paymentMethodId,
        customerId: testOrderData.customerId,
        encryptedCardNumber,
        cardNumberHash: createHash(testCardNumber),
        last4: testCardNumber.slice(-4),
        brand: detectCardBrand(testCardNumber),
        expiryMonth: 6,
        expiryYear: 2026,
        encryptedCvv,
        cvvHash: createHash(testCvv),
        billingAddressId,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Store test data
      await securePaymentDatabase.storeBillingAddress(testBillingAddress, request)
      await securePaymentDatabase.storePaymentMethod(testPaymentMethod, request)

      // Test email notification
      const emailSent = await emailService.sendOrderCompletionNotification(testOrderData, request)

      if (!emailSent) {
        throw new Error("Failed to send admin notification email")
      }

      testResults.tests.push({
        name: "Email Notification Test",
        status: "PASS",
        details: `Successfully sent admin notification email with full payment details for order ${testOrderData.orderNumber}`,
        duration: Date.now() - test3Start,
      })
    } catch (error) {
      testResults.tests.push({
        name: "Email Notification Test",
        status: "FAIL",
        details: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - test3Start,
      })
    }

    // Test 4: Payment Validation Test
    const test4Start = Date.now()
    try {
      const validationTests = [
        {
          cardNumber: "4532015112830366",
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: "123",
          shouldPass: true,
        },
        {
          cardNumber: "1234567890123456",
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: "123",
          shouldPass: false,
        },
        {
          cardNumber: "4532015112830366",
          expiryMonth: 13,
          expiryYear: 2025,
          cvv: "123",
          shouldPass: false,
        },
        {
          cardNumber: "4532015112830366",
          expiryMonth: 12,
          expiryYear: 2020,
          cvv: "123",
          shouldPass: false,
        },
      ]

      let validationsPassed = 0
      for (const test of validationTests) {
        const validation = validatePaymentData(test)
        if (validation.isValid === test.shouldPass) {
          validationsPassed++
        }
      }

      if (validationsPassed !== validationTests.length) {
        throw new Error(`Only ${validationsPassed}/${validationTests.length} validation tests passed`)
      }

      testResults.tests.push({
        name: "Payment Validation Test",
        status: "PASS",
        details: `All ${validationTests.length} validation scenarios passed correctly`,
        duration: Date.now() - test4Start,
      })
    } catch (error) {
      testResults.tests.push({
        name: "Payment Validation Test",
        status: "FAIL",
        details: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - test4Start,
      })
    }

    // Test 5: Encryption/Decryption Test
    const test5Start = Date.now()
    try {
      const testData = [
        { type: "Card Number", value: "4532015112830366" },
        { type: "CVV", value: "123" },
        { type: "Phone", value: "+1-555-123-4567" },
      ]

      for (const data of testData) {
        let encrypted: string
        let decrypted: string

        switch (data.type) {
          case "Card Number":
            encrypted = encryptCardNumber(data.value)
            decrypted = decryptCardNumber(encrypted)
            break
          case "CVV":
            encrypted = encryptCvv(data.value)
            decrypted = decryptCvv(encrypted).cvv
            break
          case "Phone":
            encrypted = encryptPhone(data.value)
            decrypted = decryptPhone(encrypted)
            break
          default:
            throw new Error(`Unknown data type: ${data.type}`)
        }

        if (decrypted !== data.value) {
          throw new Error(`${data.type} encryption/decryption failed: expected ${data.value}, got ${decrypted}`)
        }
      }

      testResults.tests.push({
        name: "Encryption/Decryption Test",
        status: "PASS",
        details: `Successfully encrypted and decrypted ${testData.length} different data types`,
        duration: Date.now() - test5Start,
      })
    } catch (error) {
      testResults.tests.push({
        name: "Encryption/Decryption Test",
        status: "FAIL",
        details: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - test5Start,
      })
    }

    // Calculate summary
    testResults.summary.total = testResults.tests.length
    testResults.summary.passed = testResults.tests.filter((test) => test.status === "PASS").length
    testResults.summary.failed = testResults.tests.filter((test) => test.status === "FAIL").length

    if (process.env.NODE_ENV !== "production") {
      console.log(`Test completed: ${testResults.summary.passed}/${testResults.summary.total} tests passed`)
    }

    return NextResponse.json(testResults)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Test execution error:", error)
    }
    return NextResponse.json({ error: "Test execution failed" }, { status: 500 })
  }
}

/**
 * Get database status and statistics
 * GET /api/payment/test
 */
export async function GET(request: NextRequest) {
  try {
    const dbStatus = await securePaymentDatabase.getDatabaseStatus()
    const securityStats = await securePaymentDatabase.getSecurityStatistics()
    const recentAuditLogs = await securePaymentDatabase.getRecentAuditLogs(10)

    const status = {
      timestamp: new Date().toISOString(),
      database: {
        status: "operational",
        ...dbStatus,
      },
      security: securityStats,
      recentActivity: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        timestamp: log.timestamp,
        success: log.success,
        riskScore: log.riskScore,
      })),
      environment: {
        nodeEnv: process.env.NODE_ENV || "development",
        hasEncryptionKey: !!process.env.PAYMENT_ENCRYPTION_KEY,
        hasEmailConfig: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
      },
    }

    return NextResponse.json(status)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error retrieving test status:", error)
    }
    return NextResponse.json({ error: "Failed to retrieve status" }, { status: 500 })
  }
}
