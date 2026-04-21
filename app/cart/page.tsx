import { unstable_noStore as noStore } from "next/cache"
import { getAllProducts } from "@/lib/products"
import type { Product } from "@/lib/products"
import CartPageClient from "./cart-page-client"

export default async function CartPage() {
  // Opt out of Next.js data cache for this page.
  // getAllProducts() returns the full catalog (~79K products) via the Neon HTTP
  // driver, which uses fetch() internally. The response is ~49MB and exceeds
  // the Next.js 2MB fetch-cache limit, causing:
  //   "Failed to set Next.js data cache, items over 2MB can not be cached"
  // noStore() tells Next.js not to attempt caching the underlying fetches.
  noStore()

  const products = await getAllProducts()
  const productDetails: Record<number, Product> = {}
  products.forEach((p) => {
    productDetails[p.id] = p
  })

  return <CartPageClient productDetails={productDetails} />
}
