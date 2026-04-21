require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Provide a path to a SQL file");
    process.exit(1);
  }
  
  const content = fs.readFileSync(path.resolve(file), "utf-8");
  const statements = content.split(";").map(s => s.trim()).filter(s => s.length > 0);
  
  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 50)}...`);
    await sql.query(statement);
  }
  console.log("All statements executed successfully.");
}

main().catch(console.error);
