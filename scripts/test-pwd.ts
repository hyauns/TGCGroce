import { neon } from '@neondatabase/serverless';
import { verifyPassword } from '../lib/password-utils.ts';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const email = 'hyauns@gmail.com';
  const password = 'duyanhday';
  
  try {
    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log('User found:', user.email);
    console.log('Hash in DB:', user.password_hash);
    
    const isValid = await verifyPassword(password, user.password_hash);
    console.log('isValidPassword:', isValid);

    if (user.login_attempts >= 5 || (user.locked_until && new Date(user.locked_until) > new Date())) {
       console.log('User is locked!');
       console.log('login_attempts:', user.login_attempts);
       console.log('locked_until:', user.locked_until);

       // Reset attempts
       await sql`UPDATE users SET login_attempts = 0, locked_until = NULL WHERE email = ${email}`;
       console.log('Unlocked user.');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
