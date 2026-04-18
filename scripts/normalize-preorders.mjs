import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load env variables
config({ path: '.env.local' });
config({ path: '.env' });

const url = process.env.DATABASE_URL;
const sql = neon(url);

async function run() {
  console.log('Bắt đầu quá trình chuẩn hóa dữ liệu Pre-order...');

  try {
    // 1. Kiểm tra số lượng trước khi update
    const beforeresult = await sql`
      SELECT COUNT(*) AS count 
      FROM products 
      WHERE is_active = true 
        AND is_pre_order = true 
        AND release_date < CURRENT_DATE
    `;
    const countBefore = beforeresult[0].count;
    console.log(`Số lượng sản phẩm pre-order bị quá hạn cần chuẩn hóa: ${countBefore}`);

    if (countBefore > 0) {
      // 2. Thực hiện UPDATE
      // Set is_pre_order = false.
      // Ngoài ra, chuyển condition thành 'new' nếu nó đang là 'pre-order'
      const updateResult = await sql`
        UPDATE products 
        SET 
          is_pre_order = false,
          condition = CASE WHEN LOWER(condition) = 'pre-order' THEN 'new' ELSE condition END
        WHERE is_active = true 
          AND is_pre_order = true 
          AND release_date < CURRENT_DATE
        RETURNING id
      `;

      console.log(`✅ Đã chuẩn hóa thành công ${updateResult.length} sản phẩm thành in-stock (Gỡ bỏ tag pre-order).`);
    } else {
      console.log('✅ Không có sản phẩm nào cần chuẩn hóa.');
    }

    // 3. Kiểm tra lại số lượng pre-order hợp lệ (ở tương lai)
    const activePreorders = await sql`
      SELECT COUNT(*) AS count 
      FROM products 
      WHERE is_active = true 
        AND is_pre_order = true
    `;
    console.log(`Hiện tại chỉ còn ${activePreorders[0].count} sản phẩm pre-order hợp lệ trong hệ thống.`);

  } catch (e) {
    console.error('Lỗi khi chạy script:', e.message);
  }
}

run();
