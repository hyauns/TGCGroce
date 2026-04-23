require("dotenv/config");
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
sql`SELECT * FROM product_categories LIMIT 10`.then(console.log).catch(console.error);
