"use client"

/**
 * auth-context.tsx — compatibility bridge
 *
 * The entire app imports `useAuth` from this file.
 * Rather than editing every import, this module re-exports the real
 * `useAuth` hook from `hooks/use-auth.tsx` which calls the actual
 * Neon-backed API routes (/api/auth/login, /api/auth/session, etc.)
 * and manages a JWT HTTP-only cookie for session persistence.
 *
 * The legacy mock (localStorage + hardcoded demo users) has been removed.
 */

export { useAuth } from "@/hooks/use-auth"
export type { User, AuthState } from "@/hooks/use-auth"

// Re-export Address and Order types used by account pages so those
// imports continue to resolve from this path.
export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

export interface Order {
  id: string
  orderNumber: string
  date: string
  status: "pending" | "processing" | "shipped" | "delivered"
  total: number
  trackingNumber?: string
  items: OrderItem[]
}

export interface Address {
  id: string
  type: "shipping" | "billing"
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
  isDefault: boolean
}

// AuthProvider is no longer needed (useAuth is a standalone hook),
// but we export a no-op wrapper so any existing <AuthProvider> usages
// in layout files do not throw import errors.
import type React from "react"
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
