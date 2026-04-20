import { neon } from "@neondatabase/serverless";

async function run() {
  const sql = neon("postgresql://neondb_owner:npg_Ur84eQWdXCcJ@ep-muddy-pine-an67umen-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require");
  // Query transactions table
  const res = await sql`SELECT id, created_at, billing_address FROM transactions ORDER BY created_at DESC LIMIT 5`;
  console.log("Mock txs:", JSON.stringify(res, null, 2));

  // Also query webhook events to see what the gateway broadcasted
  const webhook_events = await sql`SELECT id, event_name, raw_payload FROM webhook_events ORDER BY created_at DESC LIMIT 2`;
  console.log("Recent webhooks:", JSON.stringify(webhook_events, null, 2));
}

run().catch(console.error);
