require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function main() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
  if (!url) throw new Error("No DB URL");
  const sql = neon(url);
  const result = await sql`
    UPDATE site_settings 
    SET hero_subtitle = 'Discover Magic: The Gathering, Pokemon, and Yu-Gi-Oh! cards. Shop trading card games, sealed products, singles, and collectibles with clear availability, pre-order timing, and support details before checkout.' 
    WHERE id = 1
  `;
  console.log('Updated:', result);
}

main().catch(console.error);
