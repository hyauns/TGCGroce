import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    const check1 = await sql`SELECT count(*) FROM products WHERE category = 'Yu-Gi-Oh!' AND release_date < CURRENT_DATE`;
    const check2 = await sql`SELECT count(*) FROM products WHERE category = 'Yu-Gi-Oh!' AND is_pre_order = true AND release_date < CURRENT_DATE`;
    console.log(`Số lượng SẢN PHẨM (tất cả) Yu-Gi-Oh có release_date trong quá khứ:`, check1[0].count);
    console.log(`Số lượng PRE-ORDER Yu-Gi-Oh có release_date trong quá khứ:`, check2[0].count);
  } catch (err) {
    console.error(err);
  }
}
run();
