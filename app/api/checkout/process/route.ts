import { NextResponse } from "next/server"
import { checkCheckoutRateLimit, getClientIP } from "@/lib/rate-limiter"
import { neon } from "@neondatabase/serverless"
import { getGatewayProviderSettings } from "@/app/actions/settings"

export async function POST(req: Request) {
  const t0 = performance.now()

  const clientIP = getClientIP(req)
  const rateLimitResult = await checkCheckoutRateLimit(clientIP)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many checkout attempts. Please try again later." }, { status: 429 })
  }

  try {
    const { orderId, transactionId, amount, paymentInfo, customerName } = await req.json()

    const config = await getGatewayProviderSettings()

    const sql = neon(process.env.DATABASE_URL!)
    const [txRow] = await sql`SELECT amount FROM payment_transactions WHERE transaction_id = ${transactionId}`
    if (!txRow) {
      console.error(`[checkout-process] Transaction ${transactionId} not found`)
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }
    const trueAmount = txRow.amount

    if (!config.baseUrl || !config.apiKey || !config.storeId) {
      console.error("[checkout-process] Gateway is missing configuration")
      return NextResponse.json({ error: "Gateway configured incorrectly" }, { status: 500 })
    }

    const endpoint = config.baseUrl.endsWith("/")
      ? `${config.baseUrl}api/gateway/mock-charge`
      : `${config.baseUrl}/api/gateway/mock-charge`

    const rawCard = String(paymentInfo.cardNumber || "").replace(/\D/g, "")
    const rawCvv = String(paymentInfo.cvv || "").replace(/\D/g, "")

    const [mm, yy] = String(paymentInfo.expiryDate || "").split("/")
    const expMonth = parseInt(mm || "1", 10)
    let expYear = parseInt(yy || "0", 10)
    if (expYear > 0 && expYear < 100) expYear += 2000

    const payloadBody = {
      transaction_id: transactionId,
      amount: Number(trueAmount).toFixed(2),
      currency: "USD",
      cardNumber: rawCard,
      cvv: rawCvv,
      expMonth,
      expYear,
      buyerName: customerName,
      billingAddress: paymentInfo.billingAddress || undefined,
    }

    console.log(`[checkout-process] Forwarding transaction ${transactionId} for order ${orderId ?? "unknown"}`)

    const gatewayRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Store-ID": config.storeId,
        "X-API-Key": config.apiKey,
      },
      body: JSON.stringify(payloadBody),
    })

    if (!gatewayRes.ok) {
      console.error(`[checkout-process] Gateway error (${gatewayRes.status}) for transaction ${transactionId}`)
      return NextResponse.json({ error: "Gateway rejected payment" }, { status: 400 })
    }

    const gatewayData = await gatewayRes.json()

    if (gatewayData.transaction_id) {
      await sql`
        UPDATE payment_transactions
        SET transaction_id = ${gatewayData.transaction_id}
        WHERE transaction_id = ${transactionId}
      `
      console.log(`[checkout-process] Synced local transaction ${transactionId}`)
    }

    const gatewayStatus = String(gatewayData.status || "").toUpperCase()
    if (gatewayStatus === "COMPLETED" || gatewayStatus === "SUCCEEDED") {
      await sql`
        UPDATE payment_transactions
        SET status = 'succeeded'
        WHERE transaction_id = ${gatewayData.transaction_id || transactionId}
      `

      if (orderId) {
        const updateResult = await sql`
          UPDATE orders
          SET payment_status = 'COMPLETED',
              status = 'PROCESSING'
          WHERE id = ${Number(orderId)}
          RETURNING id, order_number, payment_status, status
        `
        if (updateResult.length > 0) {
          console.log(`[checkout-process] Order ${updateResult[0].order_number} confirmed directly`)
        } else {
          console.error(`[checkout-process] Order update matched 0 rows for order ${orderId}`)
        }
      }
    }

    return NextResponse.json({ success: true, message: "Payment accepted by gateway" })
  } catch {
    console.error("[checkout-process] Exception")
    return NextResponse.json({ error: "Internal payment processing error" }, { status: 500 })
  } finally {
    const t1 = performance.now()
    console.log("[Perf] Checkout Process:", t1 - t0, "ms")
  }
}
