import { getPreOrderProducts } from "@/lib/products"
import PreOrderInfoClient from "./page-client"

export default async function PreOrderInfoPage() {
  const allPreOrders = await getPreOrderProducts()
  // Take the top 4 for the featured section
  const featuredPreOrders = allPreOrders.slice(0, 4)

  return <PreOrderInfoClient preOrderProducts={featuredPreOrders} />
}

