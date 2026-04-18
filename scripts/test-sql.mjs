import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    const slug = 'yu-gi-oh';
    console.log('Querying DB for slug:', slug);
    const rows = await sql`
      SELECT
        p.id, p.name, p.category, p.category_id, p.price, p.original_price, p.image_url,
        p.stock_quantity, p.is_active, p.created_at,
        p.is_pre_order, p.release_date,
        pc.id   AS pc_id,
        pc.name AS pc_name,
        pc.slug AS pc_slug,
        pc.description AS pc_description
      FROM products p
      LEFT JOIN product_categories pc
             ON (p.category_id IS NOT NULL AND pc.id = p.category_id)
             OR (p.category_id IS NULL     AND pc.name = p.category AND pc.is_active = true)
      WHERE p.is_active = true
        AND pc.slug = ${slug}
        AND pc.is_active = true
      ORDER BY p.created_at DESC
    `;
    console.log('Strat 1&2 success! Count:', rows.length);
  } catch (err) {
    console.error('Strat 1&2 FAILED!', err.message);
  }

  try {
    const categoryRows = await sql`SELECT DISTINCT category FROM products WHERE is_active = true`;
    const getSlug = (name) => decodeURIComponent(name).toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim().replace(/^-+|-+$/g, "");
    const matchedCategory = categoryRows.find(r => getSlug(r.category) === 'yu-gi-oh');
    console.log('Strat 3 matched category:', matchedCategory.category);

    const fallbackRows = await sql`
      SELECT
        p.id, p.name, p.category, p.category_id, p.price, p.original_price, p.image_url,
        p.stock_quantity, p.is_active, p.created_at,
        p.is_pre_order, p.release_date,
        NULL::integer AS pc_id,
        NULL::text    AS pc_name,
        NULL::text    AS pc_slug,
        NULL::text    AS pc_description
      FROM products p
      WHERE p.is_active = true AND p.category = ${matchedCategory.category}
      ORDER BY p.created_at DESC
    `;
    console.log('Strat 3 success! Count:', fallbackRows.length);
  } catch (err) {
    console.error('Strat 3 FAILED!', err.message);
  }
}
run();
