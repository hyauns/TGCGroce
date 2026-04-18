"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FormattedDescription } from "./formatted-description"
import { ShoppingCart, Heart, Star, X, Plus, Minus, Clock, Calendar } from "lucide-react"

export interface ProductDetails {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  category: string
  rating?: number
  reviews?: number
  inStock: boolean
  isNew?: boolean
  isHot?: boolean
  isPreOrder?: boolean
  preOrderDate?: string
  releaseDate?: string
  description?: string
  features?: string[]
}

interface QuickViewModalProps {
  product: ProductDetails | null
  isOpen: boolean
  onClose: () => void
  onAddToCart?: (product: ProductDetails, quantity?: number) => void
  onWishlistToggle?: (product: ProductDetails) => void
  isInWishlist?: boolean
}

export function QuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onWishlistToggle,
  isInWishlist = false,
}: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity)
    }
  }

  const handleWishlistToggle = () => {
    if (onWishlistToggle) {
      onWishlistToggle(product)
    }
  }

  const incrementQuantity = () => {
    setQuantity((prev) => Math.min(prev + 1, 10))
  }

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, 1))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getDaysUntilRelease = (dateString: string) => {
    const releaseDate = new Date(dateString)
    const today = new Date()
    const diffTime = releaseDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] w-full mx-2 overflow-y-auto md:max-w-4xl md:mx-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Product Quick View</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 md:gap-8 md:p-6">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square w-full bg-slate-50 flex items-center justify-center p-6 rounded-lg overflow-hidden relative">
              <Image
                src={product.image || "/placeholder.svg?height=1000&width=1000"}
                alt={product.name}
                width={500}
                height={500}
                className="object-contain object-center"
              />
            </div>
            <div className="absolute top-2 left-2 flex flex-col gap-1 md:top-4 md:left-4 md:gap-2">
              {product.isPreOrder && (
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg border-0 px-2 py-0.5 text-xs md:px-3 md:py-1 md:text-sm">
                  <Clock className="w-2.5 h-2.5 mr-0.5 md:w-3 md:h-3 md:mr-1" />
                  PRE-ORDER
                </Badge>
              )}
              {product.originalPrice && (
                <Badge className="bg-red-500 text-white text-xs md:text-sm px-2 py-0.5 md:px-3 md:py-1">
                  Save ${(product.originalPrice - product.price).toFixed(2)}
                </Badge>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-3 md:space-y-4">
            <div>
              <div className="text-xs text-gray-600 mb-1 md:text-sm md:mb-2">{product.category}</div>
              <h2 className="text-lg font-bold mb-2 leading-tight md:text-2xl md:mb-4 md:leading-normal">
                {product.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-2 md:gap-2 md:mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 md:h-4 md:w-4 ${
                        i < Math.floor(product.rating ?? 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                {(product.reviews ?? 0) > 0 && (
                  <span className="text-xs text-gray-600 md:text-sm">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2 md:gap-3">
              <span
                className={`text-2xl font-bold md:text-3xl ${product.isPreOrder ? "text-purple-600" : "text-blue-600"}`}
              >
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-gray-500 line-through md:text-xl">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5 md:text-sm md:px-2 md:py-1"
                  >
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Pre-order info */}
            {product.isPreOrder && product.preOrderDate && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 md:p-4">
                <div className="flex items-center gap-1 mb-1 md:gap-2 md:mb-2">
                  <Calendar className="w-3 h-3 text-purple-600 md:w-4 md:h-4" />
                  <span className="font-medium text-purple-800 text-sm md:text-base">Release Date</span>
                </div>
                <p className="text-purple-700 text-sm md:text-base">{product.releaseDate}</p>
                <p className="text-xs text-purple-600 mt-0.5 md:text-sm md:mt-1">
                  {getDaysUntilRelease(product.preOrderDate)} days remaining
                </p>
              </div>
            )}

            {/* Stock Status */}
            <div>
              {product.isPreOrder ? (
                <span className="text-purple-600 font-medium flex items-center text-base md:text-lg">
                  <Clock className="w-3 h-3 mr-1 md:w-4 md:h-4 md:mr-2" />
                  Available for Pre-Order
                </span>
              ) : product.inStock ? (
                <span className="text-green-600 font-medium flex items-center text-base md:text-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 md:w-3 md:h-3 md:mr-2"></div>
                  In Stock - Ready to Ship
                </span>
              ) : (
                <span className="text-red-600 font-medium flex items-center text-base md:text-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-1 md:w-3 md:h-3 md:mr-2"></div>
                  Out of Stock
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                <FormattedDescription text={product.description} />
              </div>
            )}

            {/* Quantity and Actions */}
            {(product.inStock || product.isPreOrder) && (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 md:gap-4">
                  <span className="font-medium text-sm md:text-base">Quantity:</span>
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="h-8 w-8 rounded-r-none md:h-10 md:w-10"
                    >
                      <Minus className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <span className="px-3 py-1 min-w-[2.5rem] text-center font-medium text-sm md:px-4 md:py-2 md:min-w-[3rem] md:text-base">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={incrementQuantity}
                      disabled={quantity >= 10}
                      className="h-8 w-8 rounded-l-none md:h-10 md:w-10"
                    >
                      <Plus className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 md:gap-3">
                  <Button
                    size="lg"
                    className={`flex-1 h-10 text-sm font-semibold md:h-12 md:text-base ${
                      product.isPreOrder
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    }`}
                    onClick={handleAddToCart}
                  >
                    {product.isPreOrder ? (
                      <>
                        <Clock className="h-4 w-4 mr-1 md:h-5 md:w-5 md:mr-2" />
                        Pre-Order Now
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-1 md:h-5 md:w-5 md:mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleWishlistToggle}
                    className={`h-10 px-4 border-2 text-sm md:h-12 md:px-6 md:text-base ${
                      isInWishlist
                        ? "border-red-600 text-red-600 hover:bg-red-50"
                        : "border-gray-300 text-gray-600 hover:border-red-600 hover:text-red-600"
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 mr-1 md:h-5 md:w-5 md:mr-2 ${isInWishlist ? "fill-red-600" : "fill-none"}`}
                    />
                    <span className="hidden sm:inline">{isInWishlist ? "In Wishlist" : "Add to Wishlist"}</span>
                    <span className="sm:hidden">{isInWishlist ? "Saved" : "Save"}</span>
                  </Button>
                </div>
              </div>
            )}

            {!product.inStock && !product.isPreOrder && (
              <Button size="lg" className="w-full h-10 text-sm md:h-12 md:text-base" disabled>
                Notify When Available
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

