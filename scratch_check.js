const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function check() {
  const slugs = [
    'order-of-chaos---booster-box-1st-edition',
    'gizmoduck---suited-up',
    'avacyn-restored---intro-pack---bound-by-strength',
    'secret-lair-drop-extra-life-2020---traditional-foil-edition',
    'sanctuary-of-aria--florian-rotwood-harbinger-bottom-left',
    'sanctuary-of-aria--florian-rotwood-harbinger-top-left',
    'the-everflowing-well-extended-art'
  ];
  for (const slug of slugs) {
    // Generate a simple regex-like search since the exact string was slugified
    const parts = slug.split('-').filter(Boolean);
    const search = '%' + parts.slice(0, 3).join('%') + '%';
    const rows = await sql`SELECT id, name, is_active, stock_quantity, description, image_url, price FROM products WHERE name ILIKE ${search}`;
    
    // Exact match using the JS slug generator to be safe
    const exactMatch = rows.find(r => {
      const generated = r.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim().replace(/^-+|-+$/g, "");
      return generated === slug;
    });

    if (exactMatch) {
      console.log(`[FOUND] ${slug}: id=${exactMatch.id}, name="${exactMatch.name}", active=${exactMatch.is_active}, stock=${exactMatch.stock_quantity}, img=${!!exactMatch.image_url}`);
    } else {
      console.log(`[NOT_FOUND] ${slug}: found ${rows.length} partial matches but no exact slug. Partial matches:`);
      rows.slice(0, 5).forEach(r => console.log(`  - "${r.name}" -> slug: ${r.name.toLowerCase().replace(/[^a-z0-9\\s-]/g, "").replace(/\\s+/g, "-").replace(/-+/g, "-").trim().replace(/^-+|-+$/g, "")}`));
    }
  }
}
check();
