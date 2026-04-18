import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Bắt đầu làm trống (NULL) cột `release_date` cũ trong danh mục "Yu-Gi-Oh!"...');

  try {
    const updateResult = await sql`
      UPDATE products 
      SET release_date = NULL 
      WHERE category = 'Yu-Gi-Oh!' AND release_date < CURRENT_DATE
      RETURNING id
    `;
    
    if (updateResult.length === 0) {
      console.log('✅ DB Sạch: Không có sản phẩm Yu-Gi-Oh! nào cần phải làm trống cột release_date.');
    } else {
      console.log(`✅ Đã làm trống thành công cột release_date cho ${updateResult.length} sản phẩm Yu-Gi-Oh!.`);
    }

  } catch (e) {
    console.error('❌ Lỗi chạy script:', e.message);
  }
}

run();
