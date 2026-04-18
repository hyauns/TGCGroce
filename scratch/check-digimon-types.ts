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
    const counts = await sql`
      SELECT product_type, count(*) 
      FROM products 
      WHERE category = 'Digimon' 
      GROUP BY product_type
    `;
    
    console.log('Digimon product types breakdown:');
    console.table(counts);
  } catch (err) {
    console.error('Error DB:', err);
  }
}

main();
