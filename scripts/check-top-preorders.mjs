import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const result = await sql`
    SELECT id, name, is_pre_order, release_date 
    FROM products 
    WHERE is_active = true AND is_pre_order = true 
    LIMIT 5
  `;
  console.log('Top 5 preorders from DB directly:');
  console.log(result);
}
run();
