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
    console.log('Running Check for Digimon Singles/Cards...');

    const result = await sql`
      UPDATE products
      SET product_type = 'single'
      WHERE category IN ('Digimon', 'Digimon Card Game')
        AND (product_type IS NULL OR product_type != 'sealed')
    `;
    console.log(`Updated null product_types for Digimon to single.`);
  } catch (err) {
    console.error('Error updating DB:', err);
  }
}

main();
