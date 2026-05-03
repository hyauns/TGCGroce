const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_8BrKlzA7iUeW@ep-old-night-amnklcih.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require');
async function run() {
  const insert = await sql`INSERT INTO feed_configurations (name, category_slug, product_type, stock_status, preorder_status) VALUES ('All Products Test', null, null, 'all', 'all') RETURNING id`;
  console.log('Created feed:', insert[0].id);
}
run();
