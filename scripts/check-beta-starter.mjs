import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const checkOldCols = await sql`
    SELECT id, name, is_pre_order, release_date, condition
    FROM products 
    WHERE name LIKE '%Beta Edition Starter Deck%' 
       OR name LIKE '%Revised Edition Starter Deck%'
       OR name LIKE '%Collectors'' Edition Box%'
  `;
  console.log('Problematic products in DB:');
  console.dir(checkOldCols, { depth: null });
}
run();
