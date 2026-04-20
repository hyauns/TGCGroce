import "dotenv/config";
import { getGatewayProviderSettings } from "./app/actions/settings.ts";

async function run() {
  const config = await getGatewayProviderSettings();
  const endpoint = config.baseUrl.endsWith('/') ? `${config.baseUrl}api/gateway/mock-charge` : `${config.baseUrl}/api/gateway/mock-charge`;
  console.log("Endpoint:", endpoint);

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
  });

  console.log("Status:", gatewayRes.status);
  console.log("Response:", await gatewayRes.json().catch(e => null));
}

run().catch(console.error);
