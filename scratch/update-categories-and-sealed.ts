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
    // 1. Rename One Piece Card Game to One Piece in products table
    const resultProducts = await sql`
      UPDATE products 
      SET category = 'One Piece'
      WHERE category = 'One Piece Card Game'
    `;
    console.log(`Updated ONE PIECE products category.`);

    // 2. Rename in product_categories table if exists
    try {
      await sql`
        UPDATE product_categories
        SET name = 'One Piece', slug = 'one-piece'
        WHERE name = 'One Piece Card Game'
      `;
      console.log(`Updated ONE PIECE product_categories.`);
    } catch {
      console.log(`No product_categories table or error ignored.`);
    }

    // 3. Update all product_types dynamically across the DB
    // Sealed Condition: Name contains Pack, Booster, Deck, Box, or Case
    const resultSealed = await sql`
      UPDATE products
      SET product_type = 'sealed'
      WHERE name ILIKE '%Pack%' 
         OR name ILIKE '%Booster%' 
         OR name ILIKE '%Deck%' 
         OR name ILIKE '%Box%' 
         OR name ILIKE '%Case%'
    `;
    console.log(`Updated sealed products.`);

    // Singles Condition: Everything else
    const resultSingles = await sql`
      UPDATE products
      SET product_type = 'single'
      WHERE product_type IS NULL 
         OR product_type != 'sealed'
    `;
    console.log(`Updated single products.`);

  } catch (err) {
    console.error('Error updating DB:', err);
  }
}

main();
