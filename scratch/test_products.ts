import { neon } from "@neondatabase/serverless";
import * as dotenv from 'dotenv';
import { getProductsByCategorySlug, getSqlConnection } from '../lib/products';
import { normalizeCategoryParam } from '../lib/product-utils';

dotenv.config({ path: '.env.local' });

async function run() {
  const rawCategory = "pokemon";
  const categorySlug = normalizeCategoryParam(rawCategory);
  
  if (categorySlug) {
     const products = await getProductsByCategorySlug(categorySlug, null);
     console.log(`Found ${products.length} products for slug: ${categorySlug}`);
  }
}

run().catch(console.error);
