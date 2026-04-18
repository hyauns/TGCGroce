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
    console.log('Running update for Digimon...');

    const result = await sql`
      UPDATE products
      SET product_type = 'sealed'
      WHERE category IN ('Digimon', 'Digimon Card Game')
    `;
    console.log(`Updated sealed products for Digimon.`);
  } catch (err) {
    console.error('Error updating DB:', err);
  }
}

main();
