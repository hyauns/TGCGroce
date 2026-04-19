import { NextResponse } from "next/server"
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
        payment_method: "card",
        card_details: {
           cardNumber: rawCard,
           cvv: rawCvv,
           expMonth: expMonth,
           expYear: expYear,
           cardName: paymentInfo.cardName || customerName
        },
        buyer_name: customerName
      })
    })

    if (!gatewayRes.ok) {
       // Gateway rejected it
       const errBody = await gatewayRes.text()
       console.error(`[checkout-process] Gateway Error (${gatewayRes.status}):`, errBody)
       return NextResponse.json({ error: "Gateway rejected payment" }, { status: 400 })
    }

    // Success response: Webhooks will asynchronously handle saving the success status.
    return NextResponse.json({ success: true, message: "Payment accepted by gateway" })
  } catch (err) {
    console.error(`[checkout-process] Exception:`, err)
    return NextResponse.json({ error: "Internal payment processing error" }, { status: 500 })
  }
}
