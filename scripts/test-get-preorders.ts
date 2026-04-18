import { getPreOrderProducts } from '../lib/products';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.join(process.cwd(), '.env.local') });
config({ path: path.join(process.cwd(), '.env') });

async function run() {
  const prods = await getPreOrderProducts();
  console.log(`Backend returned ${prods.length} preorder products:`);
  prods.forEach(p => console.log(` - ${p.name} (isPreOrder: ${p.isPreOrder}, releaseDate: ${p.releaseDate})`));
}
run();
