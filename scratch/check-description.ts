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
    const productsWithDesc = await sql`SELECT count(*) FROM products WHERE description IS NOT NULL AND description != ''`;
    const productsWithoutDesc = await sql`SELECT count(*) FROM products WHERE description IS NULL OR description = ''`;
    
    console.log('Products WITH description:', productsWithDesc[0].count);
    console.log('Products WITHOUT description:', productsWithoutDesc[0].count);
  } catch (err) {
    console.error('Error DB:', err);
  }
}

main();
