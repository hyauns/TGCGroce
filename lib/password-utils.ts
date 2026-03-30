import bcrypt from "bcryptjs"

export interface PasswordValidation {
  isValid: boolean
  errors: string[]
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  // Check for common weak passwords
  const commonPasswords = ["password", "12345678", "qwerty123", "password123", "admin123", "welcome123", "letmein123"]

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("Password is too common, please choose a stronger password")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12 // Higher than minimum 10 for extra security
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
