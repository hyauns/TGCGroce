import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Bắt đầu rà soát các sản phẩm "$0" trong danh mục "Yu-Gi-Oh!"...');

  try {
    // Check how many items match
    const items = await sql`
      SELECT id, name, is_pre_order 
      FROM products 
      WHERE price = 0 AND category = 'Yu-Gi-Oh!'
    `;
    
    if (items.length === 0) {
      console.log('✅ DB Sạch: Không có sản phẩm Yu-Gi-Oh! nào bị lỗi giá $0.');
      return;
    }

    console.log(`📌 Phát hiện ${items.length} sản phẩm Yu-Gi-Oh! có giá $0. Đang tiến hành xóa...`);

    // Thực hiện xóa vĩnh viễn (DELETE)
    try {
      const delResult = await sql`
        DELETE FROM products 
        WHERE price = 0 AND category = 'Yu-Gi-Oh!'
        RETURNING id
      `;
      console.log(`✅ Đã xóa vĩnh viễn thành công ${delResult.length} sản phẩm Yu-Gi-Oh! lỗi giá 0 đô.`);
    } catch (e) {
      // Nếu dính ràng buộc khoá ngoại (Foreign Key), chuyển sang soft-delete
      console.log(`⚠️ Lỗi khi xóa vĩnh viễn (có thể do dính đơn hàng cũ/giỏ hàng). Chuyển sang ẩn (is_active = false)...`);
      const softDel = await sql`
        UPDATE products 
        SET is_active = false 
        WHERE price = 0 AND category = 'Yu-Gi-Oh!'
        RETURNING id
      `;
      console.log(`✅ Đã vô hiệu hóa (ẩn an toàn) ${softDel.length} sản phẩm Yu-Gi-Oh! lỗi giá.`);
    }

  } catch (e) {
    console.error('❌ Lỗi trong quá trình chạy script:', e.message);
  }
}

run();
