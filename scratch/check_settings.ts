import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const config = await sql`SELECT provider_name, api_key, api_secret, base_url, webhook_secret, store_id FROM payment_gateway_settings WHERE is_active = true LIMIT 1`;
  console.log("Config:", config);
}

run().catch(console.error);
