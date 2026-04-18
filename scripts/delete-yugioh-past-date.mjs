import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Bắt đầu rà soát các sản phẩm quá hạn (`release_date` < hiện tại) trong danh mục "Yu-Gi-Oh!"...');

  try {
    const items = await sql`
      SELECT id 
      FROM products 
      WHERE category = 'Yu-Gi-Oh!' AND release_date < CURRENT_DATE
    `;
    
    if (items.length === 0) {
      console.log('✅ DB Sạch: Không có sản phẩm Yu-Gi-Oh! nào có release_date trong quá khứ.');
      return;
    }

    console.log(`📌 Phát hiện ${items.length} sản phẩm (cards) có ngày phát hành trong quá khứ. Tiến hành xóa...`);

    try {
      const delResult = await sql`
        DELETE FROM products 
        WHERE category = 'Yu-Gi-Oh!' AND release_date < CURRENT_DATE
        RETURNING id
      `;
      console.log(`✅ Đã xóa vĩnh viễn thành công ${delResult.length} sản phẩm.`);
    } catch (e) {
      console.log(`⚠️ Bị dính khóa ngoại, tiến hành soft-delete (is_active = false)...`);
      const softDel = await sql`
        UPDATE products 
        SET is_active = false 
        WHERE category = 'Yu-Gi-Oh!' AND release_date < CURRENT_DATE
        RETURNING id
      `;
      console.log(`✅ Đã vô hiệu hóa thành công ${softDel.length} sản phẩm.`);
    }
  } catch (e) {
    console.error('❌ Lỗi chạy script:', e.message);
  }
}

run();
