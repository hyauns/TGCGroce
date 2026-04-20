import { Pool } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import "dotenv/config";

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const scriptPath = path.resolve("scripts/11-create-site-settings.sql");
  const query = fs.readFileSync(scriptPath, "utf-8");

  console.log("Executing 11-create-site-settings.sql...");
  await pool.query(query);
  console.log("Settings table created successfully!");
  
  await pool.end();
}

run().catch(console.error);
