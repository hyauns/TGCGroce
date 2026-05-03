const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_8BrKlzA7iUeW@ep-old-night-amnklcih.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require');
async function run() {
  const feedConfig = await sql`SELECT * FROM feed_configurations WHERE id = '580aaedc-e4c9-414b-a990-e5c1b3d10ae9'`;
  console.log(feedConfig);
}
run();
