import fs from 'fs';
import path from 'path';

const basePath = 'c:/Users/admin/Documents/Toy App/b_UOCfTeKk43v-1774686443811';
const files = [
  'app/products/[slug]/page-client.tsx',
  'app/products/page-client.tsx',
  'app/page-client.tsx',
  'app/components/quick-view-modal.tsx',
  'app/cart/cart-page-client.tsx',
  'app/preorder-info/page-client.tsx',
  'app/components/add-to-cart-popup.tsx'
];

for (const relative of files) {
  const filepath = path.join(basePath, relative);
  if (!fs.existsSync(filepath)) continue;
  
  let content = fs.readFileSync(filepath, 'utf8');

  // Add the import if not present
  if (!content.includes('ImageWithFallback')) {
    // Insert after next/image
    content = content.replace(
      /import Image.*from "next\/image"/,
      `import Image from "next/image"\nimport { ImageWithFallback } from "@/components/ui/image-with-fallback"`
    );
  }

  // Replace <Image with <ImageWithFallback for product images
  // We only replace if it's looking like a product image or if it has placeholder
  content = content.replace(/<Image(\s+src=\{[^}]+\})/g, '<ImageWithFallback$1 fallbackSrc="/placeholder.png"');

  // We might accidentally replace static images (like /images/visa.svg).
  // Fortunately, those usually use `src="/images/..."` (a literal string) and not `src={...}` binding!
  // Our regex `<Image(\s+src=\{[^}]+\})` ONLY matches data-bound src like `src={product.image || ...}`!
  
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`Updated ${relative}`);
}
