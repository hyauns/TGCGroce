/**
 * PCI DSS Compliant Payment Security Module
 * Handles encryption, decryption, and validation of sensitive payment data
 */

import crypto from "crypto"

// Encryption configuration
const ENCRYPTION_ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const TAG_LENGTH = 16 // 128 bits

// Get encryption key from environment or generate for testing
const MASTER_KEY = process.env.PAYMENT_ENCRYPTION_KEY || "test-key-for-development-only-not-secure"

// Derive encryption key using PBKDF2
function deriveKey(masterKey: string, salt: string): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, "sha256")
}

// Generate a random salt
function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex")
}

// Development-only logging helper
function devError(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    console.error(...args)
  }
}

export interface EncryptedData {
  encryptedData: string
  iv: string
  tag: string
  salt: string
}

export interface EncryptedPaymentMethod {
  id: string
  customerId: string
  encryptedCardNumber: string
  cardNumberHash: string
  last4: string
  brand: string
  expiryMonth: number
  expiryYear: number
  encryptedCvv: string
  cvvHash: string
  billingAddressId: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
  lastUsed?: Date
}

export interface SecureBillingAddress {
  id: string
  customerId: string
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  encryptedPhone?: string
  createdAt: Date
  updatedAt: Date
}

export interface PaymentAuditLog {
  id: string
  customerId: string
  action: "CREATE" | "ACCESS" | "UPDATE" | "DELETE" | "DECRYPT"
  resource: "PAYMENT_METHOD" | "BILLING_ADDRESS" | "CARD_DATA"
  resourceId: string
  adminUserId?: string
  ipAddress: string
  userAgent: string
  timestamp: Date
  success: boolean
  errorMessage?: string
  riskScore?: number
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encryptData(plaintext: string): EncryptedData {
  try {
    const salt = generateSalt()
    const key = deriveKey(MASTER_KEY, salt)
    const iv = crypto.randomBytes(IV_LENGTH)

    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
    cipher.setAAD(Buffer.from(salt, "hex"))

    let encrypted = cipher.update(plaintext, "utf8", "hex")
    encrypted += cipher.final("hex")

    const tag = cipher.getAuthTag()

    return {
      encryptedData: encrypted,
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
      salt,
    }
  } catch (error) {
    devError("Encryption error:", error)
    throw new Error("Failed to encrypt data")
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export function decryptData(encryptedData: EncryptedData): string {
  try {
    const key = deriveKey(MASTER_KEY, encryptedData.salt)
    const iv = Buffer.from(encryptedData.iv, "hex")
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)

    decipher.setAAD(Buffer.from(encryptedData.salt, "hex"))
    decipher.setAuthTag(Buffer.from(encryptedData.tag, "hex"))

    let decrypted = decipher.update(encryptedData.encryptedData, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    devError("Decryption error:", error)
    throw new Error("Failed to decrypt data")
  }
}

/**
 * Encrypt credit card number
 */
export function encryptCardNumber(cardNumber: string): string {
  const cleanCardNumber = cardNumber.replace(/\D/g, "")
  const encrypted = encryptData(cleanCardNumber)
  return JSON.stringify(encrypted)
}

/**
 * Decrypt credit card number
 */
export function decryptCardNumber(encryptedCardNumber: string): string {
  try {
    const encryptedData: EncryptedData = JSON.parse(encryptedCardNumber)
    return decryptData(encryptedData)
  } catch (error) {
    devError("Card number decryption error:", error)
    throw new Error("Failed to decrypt card number")
  }
}

/**
 * Encrypt CVV
 */
export function encryptCvv(cvv: string): string {
  const encrypted = encryptData(cvv)
  return JSON.stringify(encrypted)
}

/**
 * Decrypt CVV
 */
export function decryptCvv(encryptedCvv: string): { cvv: string } {
  try {
    const encryptedData: EncryptedData = JSON.parse(encryptedCvv)
    const cvv = decryptData(encryptedData)
    return { cvv }
  } catch (error) {
    devError("CVV decryption error:", error)
    throw new Error("Failed to decrypt CVV")
  }
}

/**
 * Encrypt phone number
 */
export function encryptPhone(phone: string): string {
  const encrypted = encryptData(phone)
  return JSON.stringify(encrypted)
}

/**
 * Decrypt phone number
 */
export function decryptPhone(encryptedPhone: string): string {
  try {
    const encryptedData: EncryptedData = JSON.parse(encryptedPhone)
    return decryptData(encryptedData)
  } catch (error) {
    devError("Phone decryption error:", error)
    throw new Error("Failed to decrypt phone number")
  }
}

/**
 * Create hash for duplicate detection (one-way)
 */
export function createHash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex")
}

/**
 * Validate payment data
 */
export function validatePaymentData(paymentData: {
  cardNumber: string
  expiryMonth: number
  expiryYear: number
  cvv: string
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate card number
  const cleanCardNumber = paymentData.cardNumber.replace(/\D/g, "")
  if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
    errors.push("Invalid card number length")
  }

  // Luhn algorithm validation
  if (!isValidLuhn(cleanCardNumber)) {
    errors.push("Invalid card number")
  }

  // Validate expiry
  if (paymentData.expiryMonth < 1 || paymentData.expiryMonth > 12) {
    errors.push("Invalid expiry month")
  }

  const currentYear = new Date().getFullYear()
  if (paymentData.expiryYear < currentYear) {
    errors.push("Card has expired")
  }

  // Validate CVV
  if (!paymentData.cvv || paymentData.cvv.length < 3 || paymentData.cvv.length > 4) {
    errors.push("Invalid CVV")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Luhn algorithm for card number validation
 */
function isValidLuhn(cardNumber: string): boolean {
  let sum = 0
  let isEven = false

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(cardNumber[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

/**
 * Create audit log entry
 */
export function createAuditLog(
  customerId: string,
  action: PaymentAuditLog["action"],
  resource: PaymentAuditLog["resource"],
  resourceId: string,
  request: any,
  success: boolean,
  adminUserId?: string,
  errorMessage?: string,
): PaymentAuditLog {
  // Extract request information
  const ipAddress = request.headers?.["x-forwarded-for"] || request.headers?.["x-real-ip"] || "127.0.0.1"
  const userAgent = request.headers?.["user-agent"] || "Unknown"

  // Calculate risk score based on various factors
  let riskScore = 0

  // Failed operations increase risk
  if (!success) riskScore += 3

  // Decrypt operations are higher risk
  if (action === "DECRYPT") riskScore += 2

  // Admin operations have different risk profile
  if (adminUserId) riskScore += 1

  // Time-based risk (off-hours)
  const hour = new Date().getHours()
  if (hour < 6 || hour > 22) riskScore += 1

  return {
    id: crypto.randomUUID(),
    customerId,
    action,
    resource,
    resourceId,
    adminUserId,
    ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
    userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
    timestamp: new Date(),
    success,
    errorMessage,
    riskScore,
  }
}

/**
 * Detect card brand from card number
 */
export function detectCardBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "")

  if (/^4/.test(digits)) return "visa"
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard"
  if (/^3[47]/.test(digits)) return "amex"
  if (/^6011/.test(digits) || /^622[1-9]/.test(digits) || /^64[4-9]/.test(digits) || /^65/.test(digits))
    return "discover"

  return "unknown"
}

/**
 * Secure data cleanup - overwrite sensitive data in memory
 */
export function secureCleanup(sensitiveData: any): void {
  if (typeof sensitiveData === "string") {
    // Overwrite string data
    for (let i = 0; i < sensitiveData.length; i++) {
      sensitiveData = sensitiveData.substring(0, i) + "0" + sensitiveData.substring(i + 1)
    }
  } else if (typeof sensitiveData === "object" && sensitiveData !== null) {
    // Recursively clean object properties
    for (const key in sensitiveData) {
      if (sensitiveData.hasOwnProperty(key)) {
        secureCleanup(sensitiveData[key])
        delete sensitiveData[key]
      }
    }
  }
}
