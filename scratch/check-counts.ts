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
  
  const c1 = await sql`SELECT COUNT(*) FROM products WHERE category = 'Flesh and Blood'`;
  console.log('Flesh and Blood count:', c1[0].count);

  const c2 = await sql`SELECT COUNT(*) FROM products WHERE category = 'Flesh and Blood TCG'`;
  console.log('Old count:', c2[0].count);
}

main().catch(console.error);
