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
    const productsWithoutType = await sql`
      SELECT count(*) 
      FROM products 
      WHERE category = 'Digimon' 
      AND (product_type IS NULL OR product_type = '')
    `;
    
    console.log('Digimon products without product_type:', productsWithoutType[0].count);

    if (productsWithoutType[0].count > 0) {
      const updateResult = await sql`
        UPDATE products 
        SET product_type = 'Cards'
        WHERE category = 'Digimon' 
        AND (product_type IS NULL OR product_type = '')
      `;
      console.log('Successfully updated product_type to Cards for these products.');
    } else {
        console.log('No products needed updating.');
    }
  } catch (err) {
    console.error('Error DB:', err);
  }
}

main();
