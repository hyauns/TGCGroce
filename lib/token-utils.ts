import { randomBytes, createHash } from "crypto"

export interface ResetToken {
  token: string
  hashedToken: string
  expiresAt: Date
}

export function generateResetToken(): ResetToken {
  // Generate cryptographically secure random token
  const token = randomBytes(32).toString("hex")

  // Hash the token for database storage (prevents token theft from DB)
  const hashedToken = createHash("sha256").update(token).digest("hex")

  // Token expires in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  return {
    token,
    hashedToken,
    expiresAt,
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex")
}
