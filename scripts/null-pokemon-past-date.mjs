import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Bắt đầu làm trống (NULL) cột `release_date` cũ lùi về quá khứ trong danh mục "Pokemon"...');

  try {
    const updateResult = await sql`
      UPDATE products 
      SET release_date = NULL, is_pre_order = false 
      WHERE category = 'Pokemon' AND release_date < CURRENT_DATE
      RETURNING id
    `;
    
    if (updateResult.length === 0) {
      console.log('✅ DB Sạch: Không có sản phẩm Pokemon nào có release_date trong quá khứ cần điều chỉnh.');
    } else {
      console.log(`✅ Đã cập nhật thành công (set release_date = NULL) cho ${updateResult.length} sản phẩm Pokemon. Giờ đây chúng đã là sản phẩm thường!`);
    }

  } catch (e) {
    console.error('❌ Lỗi chạy script:', e.message);
  }
}

run();
