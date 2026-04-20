import { NextResponse } from "next/server"
import { getGatewayProviderSettings } from "@/app/actions/settings"
import { requireAdmin } from "@/lib/auth-guard"

export const dynamic = 'force-dynamic'

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  const config = await getGatewayProviderSettings()
  const endpoint = config.baseUrl.endsWith('/') ? `${config.baseUrl}api/gateway/mock-charge` : `${config.baseUrl}/api/gateway/mock-charge`
  
  const payloadBody = {
    transaction_id: `txn_debug_${Date.now()}`,
    amount: "15.00",
    currency: "USD",
    cardNumber: "4242424242424242",
    cvv: "123",
    expMonth: 12,
    expYear: 2026,
    buyerName: "Debug User",
    billingAddress: {
      line1: "123 Debug St",
      city: "Debug City",
      state: "DB",
      postal_code: "99999",
      country: "US"
    }
  };

  const gatewayRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Store-ID": config.storeId,
      "X-API-Key": config.apiKey
    },
    body: JSON.stringify(payloadBody)
  })

  return NextResponse.json({
    status: gatewayRes.status,
    response: await gatewayRes.json().catch(() => null)
  })
}
