import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllProducts, getProductBySlug, getRelatedProducts } from "@/lib/products"

// ISR: Revalidate every hour
export const revalidate = 3600

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
      title: "Product Not Found | TGC Lore Inc.",
    }
  }

  return {
    title: `${product.name} | Premium ${product.category} Products | TGC Lore Inc.`,
    description: (product.description || "").slice(0, 160),
    keywords: [
      product.name,
      product.category,
      "trading cards",
      "booster packs",
      "collectibles",
      "TCG",
    ],
    openGraph: {
      title: product.name,
      description: (product.description || "").slice(0, 160),
      images: [{ url: product.image, alt: product.name }],
      type: "website",
      siteName: "TGC Lore Inc.",
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

  return (
    <ProductPageClient 
      product={product} 
      relatedProducts={relatedProducts} 
    />
  )
}
