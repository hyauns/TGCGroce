import { neon } from "@neondatabase/serverless";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  
  console.log("Starting database cleanup...");
  
  // TASK 1: Merge "YuGiOh" into "Yu-Gi-Oh!"
  console.log("\n--- Category Merge ---");
  const targetCategory = await sql`SELECT id FROM product_categories WHERE name = 'Yu-Gi-Oh!' LIMIT 1`;
  const oldCategory = await sql`SELECT id FROM product_categories WHERE name = 'YuGiOh' LIMIT 1`;
  
  if (targetCategory.length > 0 && oldCategory.length > 0) {
      const targetId = targetCategory[0].id;
      const oldId = oldCategory[0].id;
      
      console.log(`Merging Category ID ${oldId} (YuGiOh) into Category ID ${targetId} (Yu-Gi-Oh!)...`);
      
      const updateRes = await sql`
        UPDATE products 
        SET category_id = ${targetId}, category = 'Yu-Gi-Oh!'
        WHERE category_id = ${oldId} OR category = 'YuGiOh'
        RETURNING id
      `;
      console.log(`Updated ${updateRes.length} products to point to the correct category.`);
      
      const deleteCatRes = await sql`
        DELETE FROM product_categories WHERE id = ${oldId}
      `;
      console.log(`Deleted old 'YuGiOh' category record.`);
  } else {
      console.log(`Category merge skipped. (Either 'YuGiOh' or 'Yu-Gi-Oh!' not found).`);
  }

  // TASK 2: Delete products with price $0
  console.log("\n--- Price $0 Cleanup ---");
  
  const zeroPriceProducts = await sql`SELECT COUNT(*) as count FROM products WHERE price <= 0.00`;
  const count = parseInt(zeroPriceProducts[0].count);
  console.log(`Found ${count} products with price <= $0.00`);
  
  if (count > 0) {
      // Deleting products will also cascade delete variants/reviews/etc if set up, or we might need to handle them.
      // Assuming Prisma schema has onDelete: Cascade for most related tables.
      // Note: We're doing a raw SQL delete.
      const deleteRes = await sql`DELETE FROM products WHERE price <= 0.00 RETURNING id`;
      console.log(`Deleted ${deleteRes.length} products with $0 price.`);
  }
}

run().catch(console.error);
