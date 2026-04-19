import { neon } from "@neondatabase/serverless";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const PRODUCT_JOIN_SQL = `
  FROM products p
  LEFT JOIN product_categories pc
         ON (p.category_id IS NOT NULL AND pc.id = p.category_id)
         OR (p.category_id IS NULL     AND pc.name = p.category AND pc.is_active = true)
`;

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
      SELECT p.id, p.name as product_name, p.category, p.category_id, pc.name as pc_name, pc.slug as pc_slug
      ${sql.unsafe(PRODUCT_JOIN_SQL)}
      WHERE p.is_active = true AND pc.slug = 'pokemon'
      LIMIT 5
  `;
  console.log('Result for Pokemon slug:', rows);
}

run().catch(console.error);
