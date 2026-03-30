export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { sendEmailWithRetry, EMAIL_CONFIG } from "@/lib/email/resend-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // ── Validation ───────────────────────────────────────────────────────
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "All fields (name, email, subject, message) are required." },
        { status: 400 },
      )
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 })
    }

    // ── Build email ──────────────────────────────────────────────────────
    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      dateStyle: "full",
      timeStyle: "short",
    })

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">New Contact Form Submission</h1>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 100px;">Name</td>
              <td style="padding: 8px 0; color: #111827;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Email</td>
              <td style="padding: 8px 0; color: #111827;">
                <a href="mailto:${email}" style="color: #2563eb;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Subject</td>
              <td style="padding: 8px 0; color: #111827;">${subject}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="font-weight: 600; color: #374151; margin-bottom: 8px;">Message</p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; white-space: pre-wrap; color: #111827; line-height: 1.6;">
${message}
          </div>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
            Received on ${timestamp} (PST) via TGC Lore Contact Form
          </p>
        </div>
      </div>
    `

    const text = [
      `New Contact Form Submission`,
      `───────────────────────────`,
      `Name:    ${name}`,
      `Email:   ${email}`,
      `Subject: ${subject}`,
      ``,
      `Message:`,
      message,
      ``,
      `Received on ${timestamp} (PST) via TGC Lore Contact Form`,
    ].join("\n")

    // ── Send via Resend ──────────────────────────────────────────────────
    const result = await sendEmailWithRetry({
      to: EMAIL_CONFIG.adminEmail, // cs@tcglore.com
      subject: `[Contact Form] ${subject}`,
      html,
      text,
      from: EMAIL_CONFIG.from, // "TCG Lore Inc. <cs@tcglore.com>"
    })

    if (!result.success) {
      console.error("[contact] Email send failed:", result.error)
      return NextResponse.json(
        { error: "Failed to send your message. Please try again." },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error("[contact] Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    )
  }
}
