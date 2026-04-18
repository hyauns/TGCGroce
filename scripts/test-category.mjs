import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

// Exactly what lib/product-utils.ts does
function generateCategorySlug(name) {
  return decodeURIComponent(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^-+|-+$/g, "");
}

async function run() {
  const slug = 'yu-gi-oh';
  
  try {
    const rows = await sql`
      SELECT id, name, slug, description
      FROM product_categories
      WHERE slug = ${slug} AND is_active = true
      LIMIT 1
    `;
    console.log('product_categories result:', rows);
    
    // Fallback
    const productRows = await sql`
      SELECT DISTINCT category FROM products WHERE is_active = true
    `;

    const match = productRows.find((r) => generateCategorySlug(r.category) === slug);
    console.log('match result:', match);

  } catch (err) {
    console.error('getCategoryBySlug FAILED!', err.message);
  }
}
run();
