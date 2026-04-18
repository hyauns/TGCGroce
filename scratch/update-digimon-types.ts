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
    // 1. Convert products to "Sealed Products" if they contain sealed keywords
    const updateSealedResult = await sql`
      UPDATE products 
      SET product_type = 'sealed' 
      WHERE category = 'Digimon Card Game' 
        AND (
          name ILIKE '%pack%' OR 
          name ILIKE '%booster%' OR 
          name ILIKE '%deck%' OR 
          name ILIKE '%box%' OR 
          name ILIKE '%case%'
        )
    `;
    console.log('Digimon - Updated to Sealed Products automatically based on keywords.');

    // 2. Convert remaining null/empty to "Cards" (single)
    const updateCardsResult = await sql`
      UPDATE products 
      SET product_type = 'single'
      WHERE category = 'Digimon Card Game' 
        AND (product_type IS NULL OR product_type = '')
    `;
    console.log('Digimon - Updated remaining missing product types to Cards (single).');
    
    // We update to 'sealed' and 'single' because that is the schema convention used in filtering
    // (the TS types have "sealed" | "single")
    
    const counts = await sql`SELECT product_type, count(*) FROM products WHERE category = 'Digimon Card Game' GROUP BY product_type`;
    console.table(counts);

  } catch (err) {
    console.error('Error DB:', err);
  }
}

main();
