import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Bắt đầu quy trình kiểm tra và xử lý sản phẩm $0...');

  try {
    // 1. Check $0 pre-orders
    const zeroPricePreOrders = await sql`
      SELECT COUNT(*) AS count 
      FROM products 
      WHERE price = 0 AND is_pre_order = true
    `;
    const keptCount = zeroPricePreOrders[0].count;
    console.log(`📌 Phát hiện ${keptCount} sản phẩm pre-order đang có giá $0. => GIỮ LẠI.`);

    // 2. Check $0 non-pre-orders
    const zeroPriceNormal = await sql`
      SELECT COUNT(*) AS count, array_agg(id) as ids 
      FROM products 
      WHERE price = 0 AND is_pre_order = false
    `;
    const delCount = zeroPriceNormal[0].count;
    
    if (delCount > 0) {
      console.log(`⚠️ Phát hiện ${delCount} sản phẩm thường (in-stock) bị lỗi giá $0. => TIẾN HÀNH XÓA.`);
      
      // Perform DELETE
      try {
        const delResult = await sql`
          DELETE FROM products 
          WHERE price = 0 AND is_pre_order = false
          RETURNING id
        `;
        console.log(`✅ Đã xóa vĩnh viễn thành công ${delResult.length} sản phẩm lỗi giá.`);
      } catch (e) {
        // Fallback to soft delete if FK constraints prevent hard delete
        console.log(`⚠️ Lỗi khi xóa vĩnh viễn (có thể do ràng buộc giỏ hàng/wishlist). Chuyển sang ẩn (is_active = false)...`);
        const softDel = await sql`
          UPDATE products 
          SET is_active = false 
          WHERE price = 0 AND is_pre_order = false
          RETURNING id
        `;
        console.log(`✅ Đã ẩn (soft-delete) thành công ${softDel.length} sản phẩm lỗi giá.`);
      }
    } else {
      console.log('✅ Không có sản phẩm thường nào bị lỗi giá $0 cần xóa.');
    }

  } catch (e) {
    console.error('Lỗi trong quá trình chạy:', e.message);
  }
}

run();
