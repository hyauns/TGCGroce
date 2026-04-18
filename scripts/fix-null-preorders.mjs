import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function fixPreOrders() {
  try {
    console.log('Checking for products with is_pre_order = true AND release_date IS NULL...');
    
    const [result] = await sql`
      SELECT count(*) as count 
      FROM products 
      WHERE is_pre_order = true AND release_date IS NULL
    `;
    
    const count = parseInt(result.count, 10);
    
    if (count > 0) {
      console.log(`Found ${count} products with is_pre_order = true but missing release_date.`);
      
      const updateResult = await sql`
        UPDATE products 
        SET is_pre_order = false, updated_at = NOW()
        WHERE is_pre_order = true AND release_date IS NULL
        RETURNING id, name
      `;
      
      console.log(`Successfully updated ${updateResult.length} products to is_pre_order = false.`);
    } else {
      console.log('No products found matching the criteria. Everything is clean!');
    }
    
  } catch (err) {
    console.error('Error executing query:', err);
  }
}

fixPreOrders();
