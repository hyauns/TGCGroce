"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, Star, Trash2, Heart, Grid, List, Clock } from "lucide-react"
import Link from "next/link"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"
import { generateSlug } from "@/lib/utils"
import { isHotProduct } from "@/lib/product-utils"

export default function WishlistPage() {
  const { dispatch } = useCart()
  const { state: wishlistState, removeFromWishlist, clearWishlist } = useWishlist()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("newest")

  const addToCart = (product: any) => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        category: product.category,
        inStock: product.inStock,
      },
    })
  }

  const addAllToCart = () => {
    wishlistState.items.forEach((item) => {
      if (item.inStock || item.isPreOrder) {
        addToCart(item)
      }
    })
  }

  const sortedItems = [...wishlistState.items].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "name":
        return a.name.localeCompare(b.name)
      case "rating":
        return b.rating - a.rating
      default:
        return 0
    }
  })

  if (wishlistState.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-8">
              <Heart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-4">Your Wishlist is Empty</h1>
              <p className="text-gray-600 mb-8">
                Start adding products to your wishlist by clicking the heart icon on any product.
              </p>
              <Link href="/products">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Browse Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
          <p className="text-gray-600">
            {wishlistState.items.length} {wishlistState.items.length === 1 ? "item" : "items"} saved for later
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button onClick={addAllToCart} className="bg-blue-600 hover:bg-blue-700">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add All to Cart
            </Button>
            <Button
              variant="outline"
              onClick={clearWishlist}
              className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Wishlist
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name: A to Z</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-lg">
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
                <Grid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div
          className={
            viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
          }
        >
          {sortedItems.map((item) => (
            <Card
              key={item.id}
              className={`group hover:shadow-lg transition-shadow ${viewMode === "list" ? "flex flex-row" : ""}`}
            >
              <div className={viewMode === "list" ? "w-48 flex-shrink-0" : ""}>
                <CardHeader className="p-0">
                  <div className="relative">
                    <Link href={`/products/${item.slug || generateSlug(item.name)}`}>
                      <div
                        className={`bg-gray-100 overflow-hidden ${viewMode === "list" ? "w-48 h-48 rounded-l-lg rounded-t-none" : "w-full aspect-square rounded-t-lg"}`}
                      >
                        <img
                          src={item.image || "/placeholder.svg?height=1000&width=1000"}
                          alt={item.name}
                          className="w-full h-full object-cover object-center"
                          style={{ aspectRatio: "1 / 1" }}
                        />
                      </div>
                    </Link>
                    <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                      {item.isNew && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md border-0 text-xs font-semibold px-2 py-0.5">
                          ✦ New
                        </Badge>
                      )}
                      {(item.isHot || isHotProduct(item.id)) && (
                        <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md border-0 text-xs font-semibold px-2 py-0.5">
                          🔥 Hot
                        </Badge>
                      )}
                      {item.isPreOrder && (
                        <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border-0 text-xs font-semibold px-2 py-0.5">
                          Pre-Order
                        </Badge>
                      )}
                      {item.originalPrice && (
                        <Badge variant="secondary" className="shadow-md text-xs font-semibold">
                          Save ${(item.originalPrice - item.price).toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromWishlist(item.id)}
                        className="h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-sm text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove from wishlist</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </div>

              <div className="flex-1">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600 mb-1">{item.category}</div>
                  <Link href={`/products/${item.slug || generateSlug(item.name)}`}>
                    <CardTitle
                      className={`mb-2 line-clamp-2 hover:text-blue-600 transition-colors ${viewMode === "list" ? "text-lg" : "text-lg"}`}
                    >
                      {item.name}
                    </CardTitle>
                  </Link>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600">{item.rating}</span>
                    <span className="text-sm text-gray-500">({item.reviews})</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-blue-600">${item.price.toFixed(2)}</span>
                    {item.originalPrice && (
                      <span className="text-lg text-gray-500 line-through">${item.originalPrice.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="text-sm mb-3">
                    {item.isPreOrder ? (
                      <span className="text-purple-600 font-medium flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Pre-Order Available
                      </span>
                    ) : item.inStock ? (
                      <span className="text-green-600 font-medium">In Stock</span>
                    ) : (
                      <span className="text-red-600 font-medium">Out of Stock</span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={!item.inStock && !item.isPreOrder}
                    onClick={() => addToCart(item)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {item.isPreOrder ? "Pre-Order Now" : item.inStock ? "Add to Cart" : "Notify When Available"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeFromWishlist(item.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove from wishlist</span>
                  </Button>
                </CardFooter>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  )
}
