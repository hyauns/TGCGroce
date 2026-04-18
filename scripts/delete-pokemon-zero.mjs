import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Bắt đầu rà soát các sản phẩm "$0" trong danh mục "Pokemon"...');

  try {
    const items = await sql`
      SELECT id 
      FROM products 
      WHERE price = 0 AND category = 'Pokemon'
    `;
    
    if (items.length === 0) {
      console.log('✅ DB Sạch: Không có sản phẩm Pokemon nào bị lỗi giá $0.');
      return;
    }

    console.log(`📌 Phát hiện ${items.length} sản phẩm Pokemon có giá $0. Đang tiến hành xóa vĩnh viễn...`);

    try {
      const delResult = await sql`
        DELETE FROM products 
        WHERE price = 0 AND category = 'Pokemon'
        RETURNING id
      `;
      console.log(`✅ Đã xóa vĩnh viễn thành công ${delResult.length} sản phẩm Pokemon lỗi giá.`);
    } catch (e) {
      console.log(`⚠️ Bị dính khóa ngoại, tiến hành soft-delete (is_active = false)...`);
      const softDel = await sql`
        UPDATE products 
        SET is_active = false 
        WHERE price = 0 AND category = 'Pokemon'
        RETURNING id
      `;
      console.log(`✅ Đã vô hiệu hóa thành công ${softDel.length} sản phẩm Pokemon.`);
    }
  } catch (e) {
    console.error('❌ Lỗi chạy script:', e.message);
  }
}

run();
