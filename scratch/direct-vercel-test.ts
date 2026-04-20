import { neon } from "@neondatabase/serverless";

async function run() {
  const payloadBody = {
    store_id: "store_b092fb142a774dd0abfa2328ca870c53",
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

  const gatewayRes = await fetch("https://v0-payment-gateway-dashboard-o0qaoz3lu.vercel.app/api/gateway/mock-charge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payloadBody)
  });

  console.log("Status:", gatewayRes.status);
  console.log("Response:", await gatewayRes.json().catch(e => null));
}

run().catch(console.error);
