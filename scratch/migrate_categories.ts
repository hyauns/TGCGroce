import { neon } from "@neondatabase/serverless";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

function generateCategorySlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  
  console.log("Starting category migration...");
  
  // 1. Get unique categories from products
  const uniqueCategories = await sql`
    SELECT DISTINCT category 
    FROM products 
    WHERE category IS NOT NULL AND category != ''
  `;

  console.log(`Found ${uniqueCategories.length} distinct categories in products table.`);

  let createdCategoriesCount = 0;
  let linkedProductsCount = 0;

  for (const row of uniqueCategories) {
    const categoryName = row.category;
    const categorySlug = generateCategorySlug(categoryName);
    
    // 2. Check if category exists
    let catId: number;
    const existingCat = await sql`SELECT id FROM product_categories WHERE name = ${categoryName} LIMIT 1`;
    
    if (existingCat.length > 0) {
      catId = existingCat[0].id;
    } else {
      // It might conflict on slug instead of name, so let's handle that by throwing logic to check slug as well
      const existingSlug = await sql`SELECT id FROM product_categories WHERE slug = ${categorySlug} LIMIT 1`;
      if (existingSlug.length > 0) {
        catId = existingSlug[0].id; // Fallback to mapping by slug if name is slightly different but slug matches
      } else {
        console.log(`Creating new category: ${categoryName}`);
        const newCat = await sql`
          INSERT INTO product_categories (name, slug, is_active, display_order)
          VALUES (${categoryName}, ${categorySlug}, true, 0)
          RETURNING id
        `;
        catId = newCat[0].id;
        createdCategoriesCount++;
      }
    }

    // 3. Update products (safe update, only updates where category_id is missing)
    const updatedProducts = await sql`
      UPDATE products
      SET category_id = ${catId}
      WHERE category = ${categoryName} AND category_id IS NULL
      RETURNING id
    `;
    linkedProductsCount += updatedProducts.length;
    
    console.log(`[${categoryName}] mapped ${updatedProducts.length} new products to category_id ${catId}.`);
  }

  // Cross check total missing
  const stillMissing = await sql`SELECT COUNT(*) as count FROM products WHERE category_id IS NULL AND category IS NOT NULL`;
  
  console.log(`\nMigration completed successfully!`);
  console.log(`- New categories created: ${createdCategoriesCount}`);
  console.log(`- Products assigned a category_id: ${linkedProductsCount}`);
  console.log(`- Products still missing category_id: ${stillMissing[0].count}`);
}

run().catch(console.error);
