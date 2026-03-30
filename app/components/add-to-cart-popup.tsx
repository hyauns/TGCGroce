"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, X, Eye, ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { generateSlug } from "@/lib/utils"

interface AddToCartPopupProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: number
    name: string
    price: number
    originalPrice?: number
    image: string
    category: string
    quantity?: number
    slug?: string
  } | null
  cartCount: number
}

export function AddToCartPopup({ isOpen, onClose, product, cartCount }: AddToCartPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen && product) {
      setIsVisible(true)
      setIsAnimating(true)

      // Auto-close after 4 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [isOpen, product])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 300)
  }

  if (!isVisible || !product) return null

  const savings = product.originalPrice ? product.originalPrice - product.price : 0

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <Card
          className={`w-full max-w-md bg-white shadow-2xl border-0 pointer-events-auto transform transition-all duration-300 ${
            isAnimating ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
          }`}
        >
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-t-lg relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Added to Cart!</h3>
                    <p className="text-green-100 text-sm">Item successfully added</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Success animation */}
              <div className="absolute -top-1 -right-1">
                <div className="w-3 h-3 bg-green-300 rounded-full animate-ping"></div>
              </div>
            </div>

            {/* Product Details */}
            <div className="p-6">
              <div className="flex gap-4 mb-6">
                {/* Product Image */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border">
                  <Image
                    src={product.image || "/placeholder.svg?height=80&width=80"}
                    alt={product.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{product.category}</div>
                  <h4 className="font-semibold text-gray-900 line-clamp-2 leading-tight mb-2">{product.name}</h4>

                  {/* Price row: flex-nowrap so Save badge stays on the SAME line on mobile */}
                  <div className="flex items-center gap-2 mb-2 flex-nowrap min-w-0">
                    <span className="text-lg font-bold text-blue-600 shrink-0">${product.price.toFixed(2)}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through shrink-0">${product.originalPrice.toFixed(2)}</span>
                    )}
                    {savings > 0 && (
                      <Badge className="bg-red-100 text-red-800 text-xs shrink-0">Save ${savings.toFixed(2)}</Badge>
                    )}
                  </div>

                  {product.quantity && product.quantity > 1 && (
                    <div className="text-sm text-gray-600">
                      Quantity: <span className="font-medium">{product.quantity}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cart Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShoppingCart className="w-4 h-4 text-blue-600 shrink-0" />
                    {/* whitespace-nowrap keeps 'Cart Total: X items' on one line */}
                    <span className="text-sm font-medium text-blue-900 whitespace-nowrap">
                      Cart Total: {cartCount} item{cartCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {/* Hidden on mobile — keeps blue box clean on small screens */}
                  <div className="hidden md:block text-sm text-blue-700">Free shipping on orders $75+</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Link href="/cart" className="flex-1">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold h-11 shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={handleClose}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    View Cart
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-11 font-semibold border-2 hover:bg-gray-50 transition-all duration-200 bg-transparent"
                >
                  Continue Shopping
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex justify-center mt-4 pt-4 border-t border-gray-100">
                <Link
                  href={`/products/${product.slug || generateSlug(product.name)}`}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1"
                  onClick={handleClose}
                >
                  <Eye className="w-3 h-3" />
                  View Product Details
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
