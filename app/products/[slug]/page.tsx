import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllProducts, getProductBySlug, getRelatedProducts } from "@/lib/products"
import { siteUrl } from "@/lib/site-config"

interface PageProps {
  params: { slug: string }
}

// Generate static params for popular products (pre-render at build time)
export async function generateStaticParams() {
  const products = await getAllProducts()

  // Pre-render first 20 products at build time
  // This is a subset of all products to keep build times reasonable
  const popularProducts = products.slice(0, 20)
  
  return popularProducts.map((product) => ({
    slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  }))
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug)
  
  if (!product) {
    return {
      title: "Product Not Found | TCG Lore Operated by A TOY HAULERZ LLC Company",
    }
  }

  return {
    title: `${product.name} | Premium ${product.category} Products | TCG Lore Operated by A TOY HAULERZ LLC Company`,
    description: (product.description || "").slice(0, 160),
    keywords: [
      product.name,
      product.category,
      "trading cards",
      "booster packs",
      "collectibles",
      "TCG",
    ],
    alternates: {
      canonical: `${siteUrl}/products/${product.slug || params.slug}`,
    },
    openGraph: {
      title: product.name,
      description: (product.description || "").slice(0, 160),
      images: [{ url: product.image, alt: product.name }],
      type: "website",
      siteName: "TCG Lore Operated by A TOY HAULERZ LLC Company",
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProductBySlug(params.slug)
  
  if (!product) {
    notFound()
  }

  const relatedProducts = await getRelatedProducts(product.id)

  // Pass data to the client component
  // We'll use dynamic import for the client component
  const ProductPageClient = (await import("./page-client")).default

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": [
      `${siteUrl}${product.image}`
    ],
    "description": product.description,
    "sku": product.id.toString(),
    "mpn": product.id.toString(),
    "brand": {
      "@type": "Brand",
      "name": "Official"
    },
    "identifier_exists": false,
    "offers": {
      "@type": "Offer",
      "url": `${siteUrl}/products/${product.slug || params.slug}`,
      "priceCurrency": "USD",
      "price": product.price.toFixed(2),
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "TOY HAULERZ LLC"
      }
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductPageClient 
        product={product} 
        relatedProducts={relatedProducts} 
      />
    </>
  )
}
