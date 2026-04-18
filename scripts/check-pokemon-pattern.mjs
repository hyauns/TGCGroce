import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const result = await sql`
    SELECT DISTINCT category 
    FROM products 
    WHERE category ILIKE '%poke%'
  `;
  console.log('Categories matching "poke":', result);
}

run();
