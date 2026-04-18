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
    // Check spelling first to be safe
    const cats = await sql`SELECT category FROM products WHERE category ILIKE '%Star Wars%Unlimited%' LIMIT 1`;
    if (!cats || cats.length === 0) {
        console.log("No category matching '%Star Wars%Unlimited%' found!");
        return;
    }
    const catName = cats[0].category;
    console.log(`Found category: "${catName}"`);

    // 1. Convert products to "Sealed Products" if they contain sealed keywords
    const updateSealedResult = await sql`
      UPDATE products 
      SET product_type = 'sealed' 
      WHERE category = ${catName} 
        AND (
          name ILIKE '%pack%' OR 
          name ILIKE '%booster%' OR 
          name ILIKE '%deck%' OR 
          name ILIKE '%box%' OR 
          name ILIKE '%case%'
        )
    `;
    console.log(`Star Wars - Updated to sealed automatically based on keywords.`);

    // 2. Convert remaining null/empty or ANYTHING ELSE to "single" (as per user's "toàn bộ các sản phẩm còn lại mặc nhiên đưa về Cards/Singles")
    const updateCardsResult = await sql`
      UPDATE products 
      SET product_type = 'single'
      WHERE category = ${catName} 
        AND product_type != 'sealed'
    `;
    // Note: User said "Tất cả các sản phẩm còn lại mặc nhiên sẽ bị đưa về thể loại Cards / Singles".
    // I should probably set product_type = 'single' where product_type IS DISTINCT FROM 'sealed'.
    console.log(`Star Wars - Updated remaining product types to Cards (single).`);
    
    const counts = await sql`SELECT product_type, count(*) FROM products WHERE category = ${catName} GROUP BY product_type`;
    console.table(counts);

  } catch (err) {
    console.error('Error DB:', err);
  }
}

main();
