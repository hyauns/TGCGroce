const fs = require('fs');

const path = 'lib/products.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Add image_url to DbProductRaw
content = content.replace(
  'original_price: string | null',
  'original_price: string | null\n  image_url: string | null'
);

// 2. Add p.image_url to SQL SELECT queries
content = content.replace(/p\.price, p\.original_price,/g, 'p.price, p.original_price, p.image_url,');

// 3. Update the mapping logic
const oldMapping = 'const image = `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(categoryName)}`';
const newMapping = 'const image = row.image_url || `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(categoryName)}`';
content = content.replace(oldMapping, newMapping);

fs.writeFileSync(path, content);
console.log('Updated lib/products.ts');
