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
        amount: amount,
        currency: "USD",
        payment_method: "card",
        card_details: paymentInfo,
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
