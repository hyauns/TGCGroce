import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('No DATABASE_URL found');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    const catName = "Star Wars: Unlimited";

    // 2. Convert remaining null/empty or ANYTHING ELSE to "single" (as per user's "toàn bộ các sản phẩm còn lại mặc nhiên đưa về Cards/Singles")
    const updateCardsResult = await sql`
      UPDATE products 
      SET product_type = 'single'
      WHERE category = ${catName} 
        AND (product_type IS DISTINCT FROM 'sealed')
    `;
    console.log(`Star Wars - Updated remaining product types to Cards (single).`);
    
    const counts = await sql`SELECT product_type, count(*) FROM products WHERE category = ${catName} GROUP BY product_type`;
    console.table(counts);

  } catch (err) {
    console.error('Error DB:', err);
  }
}

main();
