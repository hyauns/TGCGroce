import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  // The transaction was for amount 262.66
  const res = await sql`SELECT id, order_number, total_amount, shipping_address FROM orders ORDER BY created_at DESC LIMIT 5`;
  console.log("Recent Storefront Orders:", JSON.stringify(res, null, 2));
}

run().catch(console.error);
