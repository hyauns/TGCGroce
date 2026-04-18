import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load env variables
config({ path: '.env.local' });
config({ path: '.env' });

const url = process.env.DATABASE_URL;
const sql = neon(url);

async function run() {
  console.log('Bắt đầu xóa (set NULL) các release_date trong quá khứ...');

  try {
    // 1. Đếm số lượng cần xử lý
    const beforeresult = await sql`
      SELECT COUNT(*) AS count 
      FROM products 
      WHERE is_active = true 
        AND release_date < CURRENT_DATE
    `;
    const countBefore = beforeresult[0].count;
    console.log(`Số lượng sản phẩm có release_date trong quá khứ: ${countBefore}`);

    if (countBefore > 0) {
      // 2. Thực hiện UPDATE (Set release_date = NULL)
      const updateResult = await sql`
        UPDATE products 
        SET release_date = NULL
        WHERE is_active = true 
          AND release_date < CURRENT_DATE
        RETURNING id
      `;

      console.log(`✅ Đã xóa thành công release_date của ${updateResult.length} sản phẩm.`);
    } else {
      console.log('✅ Không có release_date nào trong quá khứ cần xóa.');
    }

  } catch (e) {
    console.error('Lỗi khi chạy script:', e.message);
  }
}

run();
