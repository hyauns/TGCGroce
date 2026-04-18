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
    const result = await sql`
      UPDATE products 
      SET product_type = 'sealed'
      WHERE category IN ('Pokemon', 'Yu-Gi-Oh!', 'Magic: The Gathering')
    `;
    console.log(`Successfully updated products to 'sealed'.`);
  } catch (err) {
    console.error('Error updating products:', err);
  }
}

main();
