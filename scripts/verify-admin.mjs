import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const email = 'hyauns@gmail.com';
  try {
    const res = await sql`
      UPDATE users 
      SET email_verified = true 
      WHERE email = ${email}
      RETURNING *
    `;
    console.log('✅ Updated email_verified to true for:', res[0]?.email);
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
