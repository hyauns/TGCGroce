"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // Disable automatic scroll restoration
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }

    // Scroll to top on route change
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant" as ScrollBehavior,
      })
    }

    // Use setTimeout to ensure DOM is ready
    const timeoutId = setTimeout(scrollToTop, 0)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [pathname])

  return null
}
