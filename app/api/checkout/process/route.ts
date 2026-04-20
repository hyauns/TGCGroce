import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getGatewayProviderSettings } from "@/app/actions/settings"

export async function POST(req: Request) {
  try {
    const { orderId, transactionId, amount, paymentInfo, customerName } = await req.json()
    
    // Server-to-server hidden call
    const config = await getGatewayProviderSettings()
    
    if (!config.baseUrl || !config.apiKey || !config.storeId) {
      console.error("[checkout-process] Gateway is missing configuration")
      return NextResponse.json({ error: "Gateway configured incorrectly" }, { status: 500 })
    }

    const endpoint = config.baseUrl.endsWith('/') ? `${config.baseUrl}api/gateway/mock-charge` : `${config.baseUrl}/api/gateway/mock-charge`
    
    // Sanitize Card Details to pass strict gateway validation
    const rawCard = String(paymentInfo.cardNumber || "").replace(/\D/g, "")
    const rawCvv = String(paymentInfo.cvv || "").replace(/\D/g, "")
    
    // Parse expiry date (e.g., "12/25" -> month: 12, year: 2025)
    const [mm, yy] = String(paymentInfo.expiryDate || "").split("/")
    const expMonth = parseInt(mm || "1", 10)
    let expYear = parseInt(yy || "0", 10)
    if (expYear > 0 && expYear < 100) expYear += 2000

    // Make the explicit server-to-server POST to the gateway
    const gatewayRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Store-ID": config.storeId,
        "X-API-Key": config.apiKey
      },
      body: JSON.stringify({
        transaction_id: transactionId, // Passing the local transaction ID so the webhook can match it
        amount: Number(amount).toFixed(2), // Ensure precise numerical string
        currency: "USD",
        cardNumber: rawCard,
        cvv: rawCvv,
        expMonth: expMonth,
        expYear: expYear,
        buyerName: customerName
      })
    })

    if (!gatewayRes.ok) {
       // Gateway rejected it
       const errBody = await gatewayRes.text()
       console.error(`[checkout-process] Gateway Error (${gatewayRes.status}):`, errBody)
       return NextResponse.json({ error: "Gateway rejected payment" }, { status: 400 })
    }

    // Success response from gateway
    const gatewayData = await gatewayRes.json()
    const sql = neon(process.env.DATABASE_URL!)
    
    // 1. Sync the gateway's transaction_id into our local record
    if (gatewayData.transaction_id) {
       await sql`
         UPDATE payment_transactions
         SET transaction_id = ${gatewayData.transaction_id}
         WHERE transaction_id = ${transactionId}
       `
       console.log(`[checkout-process] Synced local transaction ${transactionId} -> ${gatewayData.transaction_id}`)
    }

    // 2. PRIMARY CONFIRMATION: If gateway says COMPLETED, update the order directly.
    //    This is the MAIN path — we do NOT rely on the webhook for status updates.
    //    The webhook serves as a BACKUP/idempotent confirmation only.
    const gatewayStatus = String(gatewayData.status || "").toUpperCase()
    if (gatewayStatus === "COMPLETED" || gatewayStatus === "SUCCEEDED") {
      // Update payment_transactions status
      await sql`
        UPDATE payment_transactions
        SET status = 'succeeded'
        WHERE transaction_id = ${gatewayData.transaction_id || transactionId}
      `

      // Update parent orders table — this is what the polling page reads
      if (orderId) {
        const updateResult = await sql`
          UPDATE orders
          SET payment_status = 'COMPLETED',
              status = 'PROCESSING'
          WHERE id = ${Number(orderId)}
          RETURNING id, order_number, payment_status, status
        `
        if (updateResult.length > 0) {
          console.log(`[checkout-process] ✅ Order ${updateResult[0].order_number} confirmed directly: payment_status=${updateResult[0].payment_status}, status=${updateResult[0].status}`)
        } else {
          console.error(`[checkout-process] ⚠️ Order update matched 0 rows for orderId=${orderId}`)
        }
      }
    }

    return NextResponse.json({ success: true, message: "Payment accepted by gateway" })
  } catch (err) {
    console.error(`[checkout-process] Exception:`, err)
    return NextResponse.json({ error: "Internal payment processing error" }, { status: 500 })
  }
}
