"use client"

import type React from "react"

import { CartProvider } from "@/lib/cart-context"
import { WishlistProvider } from "@/lib/wishlist-context"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ScrollToTop } from "./components/scroll-to-top"
import { AddToCartPopup } from "./components/add-to-cart-popup"
import { useCart } from "@/lib/cart-context"
import { useAnalytics } from "@/hooks/use-analytics"
import { CategoryProvider, type Category } from "@/lib/category-context"

/** Mounts the analytics page-view tracker — renders nothing. */
function AnalyticsTracker() {
  useAnalytics()
  return null
}

function AddToCartPopupWrapper() {
  const { showAddToCartPopup, addToCartPopupProduct, closeAddToCartPopup, getCartCount } = useCart()

  return (
    <AddToCartPopup
      isOpen={showAddToCartPopup}
      product={addToCartPopupProduct}
      onClose={closeAddToCartPopup}
      cartCount={getCartCount()}
    />
  )
}

export function Providers({
  children,
  categories,
}: {
  children: React.ReactNode
  categories: Category[]
}) {
  return (
    <CategoryProvider categories={categories}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AnalyticsTracker />
            {children}
            <AddToCartPopupWrapper />
            <ScrollToTop />
            <Toaster />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </CategoryProvider>
  )
}
