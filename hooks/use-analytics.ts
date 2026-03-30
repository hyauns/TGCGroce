"use client"

import { useCallback, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

// ---------------------------------------------------------------------------
// Session ID — stable per browser tab, generated once on first use
// ---------------------------------------------------------------------------

function getSessionId(): string {
  if (typeof window === "undefined") return ""
  let sid = sessionStorage.getItem("_tgc_sid")
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem("_tgc_sid", sid)
  }
  return sid
}

// ---------------------------------------------------------------------------
// Core fire-and-forget sender
// ---------------------------------------------------------------------------

function sendEvent(
  eventType: string,
  extra: {
    pageUrl?: string
    productId?: number | null
    metadata?: Record<string, unknown>
  } = {}
) {
  if (typeof window === "undefined") return
  const sessionId = getSessionId()

  // Use navigator.sendBeacon when available so events aren't lost on page unload
  const payload = JSON.stringify({
    eventType,
    pageUrl: extra.pageUrl ?? window.location.pathname,
    productId: extra.productId ?? null,
    sessionId,
    metadata: extra.metadata ?? null,
  })

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([payload], { type: "application/json" }))
  } else {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      credentials: "include",
      keepalive: true,
    }).catch(() => {})
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAnalytics() {
  const pathname = usePathname()
  const lastPathRef = useRef<string | null>(null)

  // Automatic page-view tracking on route change
  useEffect(() => {
    if (pathname === lastPathRef.current) return
    lastPathRef.current = pathname
    sendEvent("page_view", { pageUrl: pathname })
  }, [pathname])

  /** Track an add-to-cart event */
  const trackAddToCart = useCallback(
    (productId: number, productName?: string, price?: number) => {
      sendEvent("add_to_cart", {
        productId,
        metadata: { productName, price },
      })
    },
    []
  )

  /** Track a product detail page view */
  const trackProductView = useCallback((productId: number, productName?: string) => {
    sendEvent("product_view", {
      productId,
      metadata: { productName },
    })
  }, [])

  /** Track checkout initiation */
  const trackCheckoutStart = useCallback(() => {
    sendEvent("checkout_start")
  }, [])

  /** Track a completed purchase */
  const trackPurchase = useCallback(
    (orderId: string, total: number) => {
      sendEvent("purchase", {
        metadata: { orderId, total },
      })
    },
    []
  )

  /** Generic custom event */
  const trackEvent = useCallback(
    (eventType: string, metadata?: Record<string, unknown>) => {
      sendEvent(eventType, { metadata })
    },
    []
  )

  return { trackAddToCart, trackProductView, trackCheckoutStart, trackPurchase, trackEvent }
}
