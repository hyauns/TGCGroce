import { createHmac, timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/lib/generated/prisma/client"

const prisma = new PrismaClient()

type GatewayWebhookPayload = {
  event: string
  event_id: string
  transaction_id: string
  paypal_order_id: string | null
  amount: string
  currency?: string
  status: string
  timestamp: string
  status_reason?: string
  paypal_event_type?: string
  paypal_capture_id?: string
  authorization_id?: string
  gateway_fee?: string
  net_amount?: string
  payment_method?: "paypal" | "card" | "mock_card"
  card_last_4?: string
  card_brand?: string
  exp_month?: string
  exp_year?: string
  buyer_name?: string
  billing_address?: string | Record<string, unknown> | null
}

function verifyGatewaySignature(input: {
  rawBody: string
  timestamp: string
  signature: string
  secret: string
}) {
  const expected = createHmac("sha256", input.secret)
    .update(`${input.timestamp}.${input.rawBody}`)
    .digest("hex")

  // The signature shouldn't include 'sha256=' prefix, but handle it if it does
  const received = input.signature.replace(/^sha256=/, "")

  const expectedBuffer = Buffer.from(expected, "hex")
  const receivedBuffer = Buffer.from(received, "hex")

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer)
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[gateway-webhook] Missing WEBHOOK_SECRET")
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  const signature = req.headers.get("X-Webhook-Signature")
  const timestamp = req.headers.get("X-Webhook-Timestamp")
  const eventName = req.headers.get("X-Webhook-Event")

  if (!signature || !timestamp || !eventName) {
    return NextResponse.json(
      { error: "Missing required webhook headers" },
      { status: 400 }
    )
  }

  // IMPORTANT:
  // Read the raw body first to guarantee perfect signature match
  const rawBody = await req.text()

  const isValid = verifyGatewaySignature({
    rawBody,
    timestamp,
    signature,
    secret: webhookSecret,
  })

  if (!isValid) {
    console.error("[gateway-webhook] Invalid signature")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: GatewayWebhookPayload
  try {
    payload = JSON.parse(rawBody) as GatewayWebhookPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  try {
    if (eventName === "payment.capture.completed") {
      const {
        transaction_id,
        amount,
        status,
        card_last_4,
        card_brand,
        buyer_name,
        billing_address,
      } = payload

      // Skip processing if transaction_id is missing
      if (!transaction_id) {
        console.error("[gateway-webhook] Missing transaction_id in capture payload")
        return NextResponse.json({ error: "Missing transaction_id" }, { status: 400 })
      }

      // Check if this transaction exists locally
      const existingTx = await prisma.payment_transactions.findUnique({
        where: { transaction_id },
      })

      if (!existingTx) {
        console.warn(`[gateway-webhook] Transaction ${transaction_id} not found locally`)
        // Returning 200 here ensures the gateway stops retrying even if we missed the record
        // (Perhaps the customer dropped off before we could even initialize the transaction locally)
        return NextResponse.json({ ok: true, message: "Transaction not found locally" }, { status: 200 })
      }

      // Prepare metadata carefully to ensure we only save safe scalar values 
      const parsedBillingAddress = billing_address 
        ? typeof billing_address === "string" ? JSON.parse(billing_address) : billing_address
        : null

      // Update the transaction in database with safe fields
      await prisma.payment_transactions.update({
        where: { transaction_id },
        data: {
          status: status, // typically 'COMPLETED'
          card_last_4: card_last_4 ?? null,
          card_brand: card_brand ?? null,
          buyer_name: buyer_name ?? null,
          billing_address: parsedBillingAddress ?? null,
        },
      })

      // Update the parent order to reflect completion
      if (existingTx.order_id) {
        await prisma.orders.updateMany({
          where: { order_number: existingTx.order_id },
          data: {
            payment_status: "COMPLETED",
            status: "PROCESSING" // Payment succeeded, warehouse can start processing
          }
        })
      }
    }

    // Acknowledge receipt broadly
    return NextResponse.json({ ok: true }, { status: 200 })

  } catch (error) {
    console.error("[gateway-webhook] Processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
