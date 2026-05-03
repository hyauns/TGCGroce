import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllProducts, getProductBySlug, getRelatedProducts } from "@/lib/products"
import { getReviewsByProductId } from "@/lib/repositories/reviews"
import { siteUrl } from "@/lib/site-config"
import ProductPageClient from "./page-client"

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug)
  
  if (!product) {
    return {
      title: "Product Not Found | TCG Lore",
    }
  }

  // Tối ưu Title CTR: Ngắn gọn, chứa từ khóa hành động (Buy), tên sản phẩm, tránh bị cắt (truncation)
  // Giới hạn khoảng 60 ký tự
  const title = `Buy ${product.name} | TCG Lore`

  // Tối ưu Description CTR: Đưa giá và tình trạng kho vào đầu, kêu gọi hành động
  const stockText = product.inStock ? "In Stock" : "Out of Stock"
  let description = `Buy ${product.name} for $${product.price.toFixed(2)}. ${stockText}. Authentic ${product.category} trading card.`
  if (product.description) {
     description += ` ${product.description.slice(0, 70)}...`
  }
  description += " Order today!"

  // Fix image double-prefix by checking for an absolute URL
  const imageUrl = product.image.startsWith("http") ? product.image : `${siteUrl}${product.image}`
  const canonicalUrl = `${siteUrl}/products/${product.slug || params.slug}`

  return {
    title,
    description: description.slice(0, 155), // Đảm bảo < 155 chars
    keywords: [
      product.name,
      product.category,
      product.brands || "",
      product.rarity || "",
      "trading cards",
      "TCG",
    ].filter(Boolean),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description: description.slice(0, 155),
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        }
      ],
      type: "website",
      siteName: "TCG Lore",
      url: canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 155),
      images: [imageUrl],
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProductBySlug(params.slug)
  
  if (!product) {
    notFound()
  }

  const [relatedProducts, rawReviews] = await Promise.all([
    getRelatedProducts(product.id),
    product.reviews && product.reviews > 0 ? getReviewsByProductId(product.id, 10) : Promise.resolve([])
  ])

  // Fix image double-prefix by checking for an absolute URL
  const imageUrl = product.image.startsWith("http") ? product.image : `${siteUrl}${product.image}`

  // Format DB reviews
  let reviewArray: any[] = []
  if (rawReviews.length > 0) {
    reviewArray = rawReviews.map((r) => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": r.customer_name
      },
      "datePublished": r.created_at,
      "reviewBody": r.review_text || "",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": r.rating,
        "bestRating": "5",
        "worstRating": "1"
      }
    }))
  }

  const standardShippingRate = product.price >= 75 ? 0.00 : 9.99

  const productSchema: any = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": [imageUrl],
    "description": product.description,
    "sku": product.id.toString(),
    "mpn": product.id.toString(),
    ...(product.brands ? {
      "brand": {
        "@type": "Brand",
        "name": product.brands
      }
    } : {}),
    ...(product.rating && product.reviews && product.reviews > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating.toFixed(1),
        "reviewCount": product.reviews,
        "bestRating": "5",
        "worstRating": "1"
      },
      ...(reviewArray.length > 0 ? { "review": reviewArray } : {})
    } : {}),
    "offers": {
      "@type": "Offer",
      "url": `${siteUrl}/products/${product.slug || params.slug}`,
      "priceCurrency": "USD",
      "price": product.price.toFixed(2),
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.isPreOrder 
        ? "https://schema.org/PreOrder" 
        : (product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"),
      ...(product.isPreOrder && product.preOrderDate ? { "availabilityStarts": product.preOrderDate } : {}),
      "seller": {
        "@type": "Organization",
        "name": "TOY HAULERZ LLC"
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "merchantReturnDays": 30,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "applicableCountry": "US"
      },
      "shippingDetails": [
        {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": standardShippingRate.toFixed(2),
            "currency": "USD"
          },
          "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": "US"
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 1,
              "maxValue": 2,
              "unitCode": "d"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 5,
              "maxValue": 7,
              "unitCode": "d"
            }
          }
        },
        {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "19.99",
            "currency": "USD"
          },
          "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": "US"
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 1,
              "maxValue": 2,
              "unitCode": "d"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 2,
              "maxValue": 3,
              "unitCode": "d"
            }
          }
        },
        {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "39.99",
            "currency": "USD"
          },
          "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": "US"
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 1,
              "unitCode": "d"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 1,
              "maxValue": 1,
              "unitCode": "d"
            }
          }
        }
      ]
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
