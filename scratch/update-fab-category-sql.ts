import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function main() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!url) {
    throw new Error("No db URL");
  }

  const sql = neon(url);
  const result = await sql`
    UPDATE products 
    SET category = 'Flesh and Blood', updated_at = NOW() 
    WHERE category = 'Flesh and Blood TCG'
  `;

  console.log('Update result:', result);
}

main().catch(console.error);
