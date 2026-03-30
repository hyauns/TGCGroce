import { Resend } from "resend"

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

export { resend }

// Configuration constants
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || "TCG Lore Inc. <cs@tcglore.com>",
  adminEmail: process.env.ADMIN_EMAIL || "cs@tcglore.com",
  baseUrl: process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  testMode: process.env.NODE_ENV === "development",
}

// Email sending wrapper with error handling and retry logic
export async function sendEmailWithRetry(
  emailData: {
    to: string | string[]
    subject: string
    html: string
    text?: string
    from?: string
  },
  maxRetries = 3,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Sending email (attempt ${attempt}/${maxRetries}) to:`, emailData.to)

      const result = await resend.emails.send({
        from: emailData.from || EMAIL_CONFIG.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      })

      if (result.data?.id) {
        console.log(`✅ Email sent successfully! Message ID: ${result.data.id}`)
        return { success: true, messageId: result.data.id }
      } else {
        throw new Error("No message ID returned from Resend")
      }
    } catch (error) {
      lastError = error as Error
      console.error(`❌ Email send attempt ${attempt} failed:`, error)

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
        console.log(`⏳ Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  const errorMessage = lastError?.message || "Unknown error occurred"
  console.error(`❌ All email send attempts failed. Final error: ${errorMessage}`)

  return { success: false, error: errorMessage }
}
