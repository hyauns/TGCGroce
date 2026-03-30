"use client"

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
} from "react"
import { useAuth } from "@/hooks/use-auth"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WishlistItem {
  id: number
  name: string
  slug?: string
  price: number
  originalPrice?: number
  image: string
  category: string
  rating: number
  reviews: number
  inStock: boolean
  isNew?: boolean
  isHot?: boolean
  isPreOrder?: boolean
  preOrderDate?: string
  releaseDate?: string
  salesCount?: number
  dateAdded?: string
}

interface WishlistState {
  items: WishlistItem[]
  itemCount: number
}

type WishlistAction =
  | { type: "ADD_ITEM"; payload: WishlistItem }
  | { type: "REMOVE_ITEM"; payload: number }
  | { type: "CLEAR_WISHLIST" }
  | { type: "LOAD_WISHLIST"; payload: WishlistItem[] }

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case "ADD_ITEM": {
      if (state.items.some((i) => i.id === action.payload.id)) return state
      const items = [...state.items, { ...action.payload, dateAdded: new Date().toISOString() }]
      return { items, itemCount: items.length }
    }
    case "REMOVE_ITEM": {
      const items = state.items.filter((i) => i.id !== action.payload)
      return { items, itemCount: items.length }
    }
    case "CLEAR_WISHLIST":
      return { items: [], itemCount: 0 }
    case "LOAD_WISHLIST":
      return { items: action.payload, itemCount: action.payload.length }
    default:
      return state
  }
}

const initialState: WishlistState = { items: [], itemCount: 0 }

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface WishlistContextType {
  state: WishlistState
  addToWishlist: (item: WishlistItem) => void
  removeFromWishlist: (id: number) => void
  clearWishlist: () => void
  isInWishlist: (id: number) => boolean
  getWishlistCount: () => number
  getTotalValue: () => number
  getAvailableItemsCount: () => number
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

// ---------------------------------------------------------------------------
// API helpers (fire-and-forget)
// ---------------------------------------------------------------------------

async function apiAdd(productId: number) {
  try {
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId }),
    })
  } catch { /* silent */ }
}

async function apiRemove(productId: number) {
  try {
    await fetch("/api/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId }),
    })
  } catch { /* silent */ }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, initialState)
  const { isAuthenticated } = useAuth()
  const didLoadRef = useRef(false)
  const prevAuthRef = useRef(false)

  // Boot: load from DB (auth) or localStorage (guest)
  useEffect(() => {
    if (didLoadRef.current) return

    if (isAuthenticated) {
      didLoadRef.current = true
      fetch("/api/wishlist", { credentials: "include" })
        .then((r) => r.json())
        .then(({ items }) => {
          if (Array.isArray(items) && items.length > 0) {
            dispatch({ type: "LOAD_WISHLIST", payload: items })
          }
        })
        .catch(() => {})
    } else {
      try {
        const saved = localStorage.getItem("wishlist")
        if (saved) dispatch({ type: "LOAD_WISHLIST", payload: JSON.parse(saved) })
        didLoadRef.current = true
      } catch { /* ignore */ }
    }
  }, [isAuthenticated])

  // On login: migrate localStorage wishlist into DB
  useEffect(() => {
    if (!prevAuthRef.current && isAuthenticated) {
      try {
        const saved = localStorage.getItem("wishlist")
        if (saved) {
          const guestItems: WishlistItem[] = JSON.parse(saved)
          guestItems.forEach((item) => apiAdd(item.id))
          fetch("/api/wishlist", { credentials: "include" })
            .then((r) => r.json())
            .then(({ items }) => {
              if (Array.isArray(items)) dispatch({ type: "LOAD_WISHLIST", payload: items })
            })
            .catch(() => {})
          localStorage.removeItem("wishlist")
        }
      } catch { /* ignore */ }
    }
    prevAuthRef.current = isAuthenticated
  }, [isAuthenticated])

  // Guest: persist to localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        localStorage.setItem("wishlist", JSON.stringify(state.items))
      } catch { /* ignore */ }
    }
  }, [state.items, isAuthenticated])

  const addToWishlist = (item: WishlistItem) => {
    dispatch({ type: "ADD_ITEM", payload: item })
    if (isAuthenticated) apiAdd(item.id)
  }

  const removeFromWishlist = (id: number) => {
    dispatch({ type: "REMOVE_ITEM", payload: id })
    if (isAuthenticated) apiRemove(id)
  }

  const clearWishlist = () => dispatch({ type: "CLEAR_WISHLIST" })

  const isInWishlist = (id: number) => state.items.some((i) => i.id === id)
  const getWishlistCount = () => state.itemCount
  const getTotalValue = () => state.items.reduce((t, i) => t + i.price, 0)
  const getAvailableItemsCount = () => state.items.filter((i) => i.inStock || i.isPreOrder).length

  const value: WishlistContextType = {
    state,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    getWishlistCount,
    getTotalValue,
    getAvailableItemsCount,
  }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider")
  return context
}
