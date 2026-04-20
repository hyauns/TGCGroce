import { neon } from "@neondatabase/serverless";
import "dotenv/config";

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`SELECT * FROM site_settings WHERE id = 1`;
  console.log("DB site_settings:", JSON.stringify(rows, null, 2));
}

run().catch(console.error);
