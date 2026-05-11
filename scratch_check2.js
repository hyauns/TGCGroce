const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().replace(/^-+|-+$/g, '');
}

async function run() {
  const slugs = [
    'sanctuary-of-aria-florian-rotwood-harbinger-bottom-left',
    'sanctuary-of-aria-florian-rotwood-harbinger-top-left',
    'the-everflowing-well-extended-art'
  ];
  for (const slug of slugs) {
    const parts = slug.split('-').filter(Boolean);
    const search = '%' + parts.slice(0,3).join('%') + '%';
    const rows = await sql`SELECT id, name FROM products WHERE name ILIKE ${search}`;
    const match = rows.find(r => generateSlug(r.name) === slug);
    console.log(slug, match ? 'FOUND: ' + match.name : 'NOT_FOUND. Matches: ' + rows.slice(0,3).map(r => generateSlug(r.name)).join(', '));
  }
}
run();
