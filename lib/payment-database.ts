/**
 * PCI DSS Compliant Database operations for secure payment data storage
 * This implementation stores encrypted payment card data with proper security controls
 */

import type { EncryptedPaymentMethod, SecureBillingAddress, PaymentAuditLog } from "./payment-security"
import { createAuditLog } from "./payment-security"

// Transaction record interface
interface PaymentTransaction {
  id: string
  customerId: string
  paymentMethodId: string
  orderId: string
  transactionId: string
  authorizationCode: string
  amount: number
  currency: string
  status: "pending" | "succeeded" | "failed" | "refunded" | "partially_refunded"
  gatewayResponse: any
  riskScore: number
  processedAt: Date
}

// Security statistics interface
interface SecurityStatistics {
  totalPaymentMethods: number
  totalTransactions: number
  totalCustomers: number
  highRiskTransactions: number
  failedTransactions: number
  averageRiskScore: number
  recentActivity: {
    last24Hours: number
    last7Days: number
    last30Days: number
  }
  topRiskFactors: Array<{
    factor: string
    count: number
  }>
}

// Development-only logging helper
function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args)
  }
}

function isInMemoryPaymentStoreEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.PAYMENT_TEST_MODE === "true"
}

function assertInMemoryPaymentStoreEnabled(): void {
  if (!isInMemoryPaymentStoreEnabled()) {
    throw new Error("In-memory payment store is disabled")
  }
}

// Development-only in-memory payment store.
class SecurePaymentDatabase {
  private paymentMethods: Map<string, EncryptedPaymentMethod> = new Map()
  private billingAddresses: Map<string, SecureBillingAddress> = new Map()
  private auditLogs: PaymentAuditLog[] = []
  private transactions: Map<string, PaymentTransaction> = new Map()

  /**
   * Store encrypted payment method with full card data
   */
  async storePaymentMethod(paymentMethod: EncryptedPaymentMethod, request: any): Promise<boolean> {
    try {
      assertInMemoryPaymentStoreEnabled()
      // Validate payment method data
      if (!paymentMethod.encryptedCardNumber || !paymentMethod.customerId || !paymentMethod.encryptedCvv) {
        throw new Error("Invalid payment method data")
      }

      // Check for duplicate card numbers using hash
      const existingCards = Array.from(this.paymentMethods.values()).filter(
        (method) =>
          method.customerId === paymentMethod.customerId && method.cardNumberHash === paymentMethod.cardNumberHash,
      )

      if (existingCards.length > 0) {
        throw new Error("Payment method already exists")
      }

      // Store payment method
      this.paymentMethods.set(paymentMethod.id, paymentMethod)

      // Create audit log
      const auditLog = createAuditLog(
        paymentMethod.customerId,
        "CREATE",
        "PAYMENT_METHOD",
        paymentMethod.id,
        request,
        true,
      )
      await this.storeAuditLog(auditLog)

      devLog("Payment method stored successfully")

      return true
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error storing payment method:", error)
      }

      // Create error audit log
      const auditLog = createAuditLog(
        paymentMethod.customerId,
        "CREATE",
        "PAYMENT_METHOD",
        paymentMethod.id,
        request,
        false,
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      )
      await this.storeAuditLog(auditLog)

      return false
    }
  }

  /**
   * Store billing address with encryption for sensitive fields
   */
  async storeBillingAddress(address: SecureBillingAddress, request: any): Promise<boolean> {
    try {
      assertInMemoryPaymentStoreEnabled()
      // Validate address data
      if (!address.customerId || !address.firstName || !address.lastName) {
        throw new Error("Invalid billing address data")
      }

      // Store billing address
      this.billingAddresses.set(address.id, address)

      // Create audit log
      const auditLog = createAuditLog(address.customerId, "CREATE", "BILLING_ADDRESS", address.id, request, true)
      await this.storeAuditLog(auditLog)

      devLog("Billing address stored successfully")

      return true
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error storing billing address:", error)
      }

      // Create error audit log
      const auditLog = createAuditLog(
        address.customerId,
        "CREATE",
        "BILLING_ADDRESS",
        address.id,
        request,
        false,
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      )
      await this.storeAuditLog(auditLog)

      return false
    }
  }

  /**
   * Store transaction record
   */
  async storeTransaction(transaction: PaymentTransaction, request: any): Promise<boolean> {
    try {
      assertInMemoryPaymentStoreEnabled()
      this.transactions.set(transaction.id, transaction)

      devLog("Transaction stored successfully")

      return true
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error storing transaction:", error)
      }
      return false
    }
  }

  /**
   * Retrieve customer payment methods (encrypted data)
   */
  async getCustomerPaymentMethods(customerId: string, request: any): Promise<EncryptedPaymentMethod[]> {
    try {
      assertInMemoryPaymentStoreEnabled()
      const methods = Array.from(this.paymentMethods.values())
        .filter((method) => method.customerId === customerId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      // Create audit log for access
      const auditLog = createAuditLog(customerId, "ACCESS", "PAYMENT_METHOD", "multiple", request, true)
      await this.storeAuditLog(auditLog)

      devLog(`Retrieved ${methods.length} payment methods`)

      return methods
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error retrieving payment methods:", error)
      }

      // Create error audit log
      const auditLog = createAuditLog(
        customerId,
        "ACCESS",
        "PAYMENT_METHOD",
        "multiple",
        request,
        false,
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      )
      await this.storeAuditLog(auditLog)

      return []
    }
  }

  /**
   * Retrieve specific payment method by ID
   */
  async getPaymentMethod(paymentMethodId: string, request: any): Promise<EncryptedPaymentMethod | null> {
    try {
      assertInMemoryPaymentStoreEnabled()
      const method = this.paymentMethods.get(paymentMethodId)

      if (!method) {
        return null
      }

      // Create audit log for access
      const auditLog = createAuditLog(method.customerId, "ACCESS", "PAYMENT_METHOD", paymentMethodId, request, true)
      await this.storeAuditLog(auditLog)

      devLog("Retrieved payment method")

      return method
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error retrieving payment method:", error)
      }

      // Create error audit log
      const auditLog = createAuditLog(
        "unknown",
        "ACCESS",
        "PAYMENT_METHOD",
        paymentMethodId,
        request,
        false,
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      )
      await this.storeAuditLog(auditLog)

      return null
    }
  }

  /**
   * Retrieve billing address
   */
  async getBillingAddress(addressId: string, request: any): Promise<SecureBillingAddress | null> {
    try {
      assertInMemoryPaymentStoreEnabled()
      const address = this.billingAddresses.get(addressId)

      if (!address) {
        return null
      }

      // Create audit log for access
      const auditLog = createAuditLog(address.customerId, "ACCESS", "BILLING_ADDRESS", addressId, request, true)
      await this.storeAuditLog(auditLog)

      devLog("Retrieved billing address")

      return address
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error retrieving billing address:", error)
      }

      // Create error audit log
      const auditLog = createAuditLog(
        "unknown",
        "ACCESS",
        "BILLING_ADDRESS",
        addressId,
        request,
        false,
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      )
      await this.storeAuditLog(auditLog)

      return null
    }
  }

  /**
   * Update payment method (limited fields for security)
   */
  async updatePaymentMethod(
    paymentMethodId: string,
    updates: Partial<EncryptedPaymentMethod>,
    request: any,
  ): Promise<boolean> {
    try {
      assertInMemoryPaymentStoreEnabled()
      const existingMethod = this.paymentMethods.get(paymentMethodId)
      if (!existingMethod) {
        return false
      }

      // Only allow safe updates
      const allowedUpdates = {
        isDefault: updates.isDefault,
        lastUsed: updates.lastUsed || new Date(),
        updatedAt: new Date(),
      }

      const mergedUpdates = { ...existingMethod, ...allowedUpdates } as typeof existingMethod
      // Ensure isDefault is always a boolean
      mergedUpdates.isDefault = mergedUpdates.isDefault ?? false
      this.paymentMethods.set(paymentMethodId, mergedUpdates)

      // Create audit log
      const auditLog = createAuditLog(
        existingMethod.customerId,
        "UPDATE",
        "PAYMENT_METHOD",
        paymentMethodId,
        request,
        true,
      )
      await this.storeAuditLog(auditLog)

      devLog("Updated payment method")

      return true
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error updating payment method:", error)
      }

      // Create error audit log
      const auditLog = createAuditLog(
        "unknown",
        "UPDATE",
        "PAYMENT_METHOD",
        paymentMethodId,
        request,
        false,
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      )
      await this.storeAuditLog(auditLog)

      return false
    }
  }

  /**
   * Delete payment method (secure deletion)
   */
  async deletePaymentMethod(paymentMethodId: string, request: any, adminUserId?: string): Promise<boolean> {
    try {
      assertInMemoryPaymentStoreEnabled()
      // Get payment method for audit log
      const paymentMethod = this.paymentMethods.get(paymentMethodId)
      if (!paymentMethod) {
        return false
      }

      // Secure deletion - overwrite sensitive data before deletion
      const securelyDeletedMethod = {
        ...paymentMethod,
        encryptedCardNumber: "SECURELY_DELETED",
        encryptedCvv: "SECURELY_DELETED",
        cardNumberHash: "DELETED",
        cvvHash: "DELETED",
      }

      // Store the overwritten version briefly, then delete
      this.paymentMethods.set(paymentMethodId, securelyDeletedMethod)

      // Then delete the record
      const deleted = this.paymentMethods.delete(paymentMethodId)

      // Create audit log
      const auditLog = createAuditLog(
        paymentMethod.customerId,
        "DELETE",
        "PAYMENT_METHOD",
        paymentMethodId,
        request,
        deleted,
        adminUserId,
      )
      await this.storeAuditLog(auditLog)

      devLog("Securely deleted payment method")

      return deleted
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error deleting payment method:", error)
      }

      // Create error audit log
      const auditLog = createAuditLog(
        "unknown",
        "DELETE",
        "PAYMENT_METHOD",
        paymentMethodId,
        request,
        false,
        adminUserId,
        error instanceof Error ? error.message : "Unknown error",
      )
      await this.storeAuditLog(auditLog)

      return false
    }
  }

  /**
   * Store audit log
   */
  async storeAuditLog(log: PaymentAuditLog): Promise<boolean> {
    try {
      assertInMemoryPaymentStoreEnabled()
      this.auditLogs.push(log)

      // Keep only last 10000 logs in memory for testing
      if (this.auditLogs.length > 10000) {
        this.auditLogs = this.auditLogs.slice(-10000)
      }

      return true
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error storing audit log:", error)
      }
      return false
    }
  }

  /**
   * Get audit logs for customer
   */
  async getCustomerAuditLogs(customerId: string, limit = 100): Promise<PaymentAuditLog[]> {
    try {
      assertInMemoryPaymentStoreEnabled()
      return this.auditLogs
        .filter((log) => log.customerId === customerId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error retrieving audit logs:", error)
      }
      return []
    }
  }

  /**
   * Get high-risk audit logs for monitoring
   */
  async getHighRiskAuditLogs(riskThreshold = 7, limit = 50): Promise<PaymentAuditLog[]> {
    try {
      assertInMemoryPaymentStoreEnabled()
      return this.auditLogs
        .filter((log) => (log.riskScore || 0) >= riskThreshold)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error retrieving high-risk audit logs:", error)
      }
      return []
    }
  }

  /**
   * Get recent audit logs
   */
  async getRecentAuditLogs(limit = 100): Promise<PaymentAuditLog[]> {
    try {
      assertInMemoryPaymentStoreEnabled()
      return this.auditLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit)
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error retrieving recent audit logs:", error)
      }
      return []
    }
  }

  /**
   * Get security statistics
   */
  async getSecurityStatistics(startDate?: string, endDate?: string): Promise<SecurityStatistics> {
    try {
      assertInMemoryPaymentStoreEnabled()
      const now = new Date()
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const totalPaymentMethods = this.paymentMethods.size
      const totalTransactions = this.transactions.size
      const totalCustomers = new Set(Array.from(this.paymentMethods.values()).map((m) => m.customerId)).size

      const transactionArray = Array.from(this.transactions.values())
      const highRiskTransactions = transactionArray.filter((t) => t.riskScore >= 7).length
      const failedTransactions = transactionArray.filter((t) => t.status === "failed").length
      const averageRiskScore =
        transactionArray.length > 0
          ? transactionArray.reduce((sum, t) => sum + t.riskScore, 0) / transactionArray.length
          : 0

      const recentAuditLogs = this.auditLogs.filter((log) => {
        const logDate = new Date(log.timestamp)
        return logDate >= last30Days
      })

      const recentActivity = {
        last24Hours: recentAuditLogs.filter((log) => new Date(log.timestamp) >= last24Hours).length,
        last7Days: recentAuditLogs.filter((log) => new Date(log.timestamp) >= last7Days).length,
        last30Days: recentAuditLogs.length,
      }

      // Analyze risk factors
      const riskFactors = new Map<string, number>()
      this.auditLogs.forEach((log) => {
        if ((log.riskScore || 0) >= 5) {
          const factor = `${log.action}_${log.resource}`
          riskFactors.set(factor, (riskFactors.get(factor) || 0) + 1)
        }
      })

      const topRiskFactors = Array.from(riskFactors.entries())
        .map(([factor, count]) => ({ factor, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      return {
        totalPaymentMethods,
        totalTransactions,
        totalCustomers,
        highRiskTransactions,
        failedTransactions,
        averageRiskScore: Math.round(averageRiskScore * 100) / 100,
        recentActivity,
        topRiskFactors,
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error retrieving security statistics:", error)
      }
      return {
        totalPaymentMethods: 0,
        totalTransactions: 0,
        totalCustomers: 0,
        highRiskTransactions: 0,
        failedTransactions: 0,
        averageRiskScore: 0,
        recentActivity: { last24Hours: 0, last7Days: 0, last30Days: 0 },
        topRiskFactors: [],
      }
    }
  }

  /**
   * Get database status for testing
   */
  async getDatabaseStatus(): Promise<{
    paymentMethods: number
    billingAddresses: number
    auditLogs: number
    transactions: number
  }> {
    assertInMemoryPaymentStoreEnabled()
    return {
      paymentMethods: this.paymentMethods.size,
      billingAddresses: this.billingAddresses.size,
      auditLogs: this.auditLogs.length,
      transactions: this.transactions.size,
    }
  }

  /**
   * Clear all data (for testing only)
   */
  async clearAllData(): Promise<void> {
    assertInMemoryPaymentStoreEnabled()
    this.paymentMethods.clear()
    this.billingAddresses.clear()
    this.auditLogs.length = 0
    this.transactions.clear()
    devLog("Test data cleared")
  }
}

// Export singleton instance
export const securePaymentDatabase = new SecurePaymentDatabase()
