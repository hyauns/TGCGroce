import { getAllProducts } from "@/lib/products"
import type { Product } from "@/lib/products"
import CartPageClient from "./cart-page-client"

export default async function CartPage() {
  // Preload all products into the cache for the Client Component
  const products = await getAllProducts()
  const productDetails: Record<number, Product> = {}
  products.forEach((p) => {
    productDetails[p.id] = p
  })

  return <CartPageClient productDetails={productDetails} />
}

