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
    console.log('Running update for Disney Lorcana...');

    // Set Sealed Condition for Disney Lorcana
    const resultSealed = await sql`
      UPDATE products
      SET product_type = 'sealed'
      WHERE category = 'Disney Lorcana'
        AND (
          name ILIKE '%Pack%' 
          OR name ILIKE '%Booster%' 
          OR name ILIKE '%Deck%' 
          OR name ILIKE '%Box%' 
          OR name ILIKE '%Case%'
        )
    `;
    console.log(`Updated sealed products for Disney Lorcana.`);

    // Set Singles Condition for Disney Lorcana (anything not sealed)
    const resultSingles = await sql`
      UPDATE products
      SET product_type = 'single'
      WHERE category = 'Disney Lorcana'
        AND (product_type IS NULL OR product_type != 'sealed')
    `;
    console.log(`Updated single products for Disney Lorcana.`);

  } catch (err) {
    console.error('Error updating DB:', err);
  }
}

main();
