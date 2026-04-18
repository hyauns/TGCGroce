import fs from 'fs';
import path from 'path';

const basePath = 'c:/Users/admin/Documents/Toy App/b_UOCfTeKk43v-1774686443811';
const files = [
  'app/wishlist/page.tsx',
  'app/admin/products/page-client.tsx'
];

for (const relative of files) {
  const filepath = path.join(basePath, relative);
  if (!fs.existsSync(filepath)) continue;
  
  let content = fs.readFileSync(filepath, 'utf8');

  // Add the import if not present
  if (!content.includes('ImageWithFallback')) {
    content = content.replace(
      /import Image.*from "next\/image"/,
      `import Image from "next/image"\nimport { ImageWithFallback } from "@/components/ui/image-with-fallback"`
    );
  }

  content = content.replace(/<Image(\s+src=\{[^}]+\})/g, '<ImageWithFallback$1 fallbackSrc="/placeholder.png"');
  
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`Updated ${relative}`);
}
