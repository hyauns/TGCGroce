const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    const rows = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'products'`;
    console.log(rows.map(r => r.column_name).join(', '));
  } catch (e) {
    console.error(e);
  }
}
run();
