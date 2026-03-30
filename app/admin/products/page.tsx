"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import Image from "next/image"

interface Product {
  id: string
  name: string
  title: string
  price: number
  image: string
  category: string
  in_stock: boolean
  featured: boolean
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock products data since they're managed via JSON
    const mockProducts = [
      {
        id: "1",
        name: "Tarkir Dragonstorm Bundle",
        title: "Tarkir Dragonstorm Bundle",
        price: 49.99,
        image: "/images/tarkir-dragonstorm-bundle.webp",
        category: "Magic: The Gathering",
        in_stock: true,
        featured: true,
      },
      {
        id: "2",
        name: "Edge of Eternities Bundle",
        title: "Edge of Eternities Bundle",
        price: 54.99,
        image: "/images/edge-eternities-bundle.webp",
        category: "Magic: The Gathering",
        in_stock: true,
        featured: true,
      },
      {
        id: "3",
        name: "Tarkir Play Boosters",
        title: "Tarkir Play Boosters (24 Pack Box)",
        price: 89.99,
        image: "/images/tarkir-play-boosters.webp",
        category: "Magic: The Gathering",
        in_stock: false,
        featured: false,
      },
    ]

    setTimeout(() => {
      setProducts(mockProducts)
      setLoading(false)
    }, 1000)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getStockStatus = (inStock: boolean) => {
    return inStock
      ? { label: "In Stock", color: "bg-green-100 text-green-800" }
      : { label: "Out of Stock", color: "bg-red-100 text-red-800" }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Products are managed via JSON file. This is a read-only view for inventory monitoring.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const stockStatus = getStockStatus(product.in_stock)

            return (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative h-48">
                  <Image src={product.image || "/placeholder.svg"} alt={product.title} fill className="object-cover" />
                  {product.featured && <Badge className="absolute top-2 left-2 bg-blue-600 text-white">Featured</Badge>}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{product.category}</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(product.price)}
                    </span>
                    <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                  </div>

                  {/* Mock stock level indicator */}
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Stock Level</span>
                      <span>{product.in_stock ? "15 units" : "0 units"}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${product.in_stock ? "bg-green-500" : "bg-red-500"}`}
                        style={{ width: product.in_stock ? "60%" : "0%" }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
