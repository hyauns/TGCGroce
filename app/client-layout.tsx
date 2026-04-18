"use client"

import type React from "react"

import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"
import { WishlistProvider } from "@/lib/wishlist-context"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ScrollToTop } from "./components/scroll-to-top"
import { AddToCartPopup } from "./components/add-to-cart-popup"
import { useCart } from "@/lib/cart-context"
import { useAnalytics } from "@/hooks/use-analytics"

const inter = Inter({ subsets: ["latin"] })

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

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
      </body>
    </html>
  )
}

