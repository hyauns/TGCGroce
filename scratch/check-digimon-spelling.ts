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
    const cats = await sql`
      SELECT category, count(*) 
      FROM products 
      WHERE category ILIKE '%Digi%' 
      GROUP BY category
    `;
    
    console.log('Categories matching %Digi%:');
    console.table(cats);
  } catch (err) {
    console.error('Error DB:', err);
  }
}

main();
