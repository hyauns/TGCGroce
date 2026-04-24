const fs = require("fs");
let code = fs.readFileSync("lib/products.ts", "utf8");
code = code.replace("import \"server-only\"", "import \"server-only\"\nimport { cache } from \"react\"");

const functionsToCache = [
  "getAllProducts",
  "getProductById",
  "getProductBySlug",
  "getProductsByCategory",
  "getCategoryBySlug",
  "getProductsByCategorySlug",
  "getAllCategorySlugs",
  "getFeaturedProducts",
  "getBestSellingProducts",
  "getPreOrderProducts",
  "getRelatedProducts",
  "getRelatedProductsBySlug",
  "searchProducts"
];

for (const fn of functionsToCache) {
  const regex = new RegExp(`export async function ${fn}([\\s\\S]*?)\n}`, "m");
  code = code.replace(regex, `export const ${fn} = cache(async function ${fn}$1\n})`);
}

fs.writeFileSync("lib/products.ts", code);
