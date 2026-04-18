import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const email = 'hyauns@gmail.com';
  const password = 'duyanhday';
  const role = 'admin';

  try {
    const hash = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const existing = await sql`SELECT user_id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      await sql`
        UPDATE users 
        SET password_hash = ${hash}, role = ${role}, status = 'active'
        WHERE email = ${email}
      `;
      console.log('✅ Đã cập nhật mật khẩu và cấp quyền Admin cho tài khoản đã tồn tại:', email);
    } else {
      await sql`
        INSERT INTO users (email, password_hash, role, status)
        VALUES (${email}, ${hash}, ${role}, 'active')
      `;
      console.log('✅ Đã tạo mới tài khoản Admin thành công:', email);
    }
  } catch (err) {
    console.error('❌ Lỗi:', err);
  }
}
run();
