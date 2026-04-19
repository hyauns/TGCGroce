import { neon } from "@neondatabase/serverless";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  
  const query = "Pikchu";
  const rows = await sql`
      SELECT id, name, similarity(name, ${query}) as sim
      FROM products
      WHERE similarity(name, ${query}) > 0.15
      ORDER BY similarity(name, ${query}) DESC
      LIMIT 10
  `;
  console.log('Results for "Pikchu":', rows);
}

run().catch(console.error);
