// @ts-ignore
const tsNode = require('ts-node');
tsNode.register({ transpileOnly: true });

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { getProductsByCategorySlug, getCategoryBySlug } = require('./lib/products.ts');

async function run() {
  try {
    const products = await getProductsByCategorySlug('yu-gi-oh');
    console.log(`Found ${products.length} products for slug 'yu-gi-oh'`);
    
    // Check if the query logic inside strategy 3 actually finds 'Yu-Gi-Oh!'
    const meta = await getCategoryBySlug('yu-gi-oh');
    console.log('Category Meta resolving check:', meta);

  } catch (e) {
    console.error('Error:', e);
  }
}
run();
