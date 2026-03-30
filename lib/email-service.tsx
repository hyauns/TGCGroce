import { sendEmailWithRetry } from "./email/resend-client"
import {
  sendOrderConfirmation,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendAdminOrderNotification,
  emailService as newEmailService,
  type OrderEmailData,
  type UserData,
} from "./email/send-email"

// Re-export everything for backward compatibility
export {
  sendOrderConfirmation,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendAdminOrderNotification,
  type OrderEmailData,
  type UserData,
}

// Legacy interface for backward compatibility
interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Generic email sending function using Resend
export async function sendEmail(options: EmailOptions): Promise<void> {
  const result = await sendEmailWithRetry({
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })

  if (!result.success) {
    throw new Error(result.error || "Failed to send email")
  }
}

// Export the main email service
export const emailService = newEmailService
export default emailService
