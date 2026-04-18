const { getCategoryBySlug, getProductsByCategorySlug } = require('./lib/products.ts');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function run() {
  const categorySlug = 'yu-gi-oh';
  const categoryMeta = await getCategoryBySlug(categorySlug);
  const products = await getProductsByCategorySlug(categorySlug);

  console.log('Category Meta:', categoryMeta);
  console.log('Products count:', products.length);
}
run();
