import Fuse from "fuse.js"
import productsData from "@/data/products.json"

export interface Product {
  id: number
  name: string
  slug: string
  price: number
  category: string
  image: string
  description: string
  stock: number
  inStock?: boolean
  originalPrice?: number
  isPreOrder?: boolean
  isHot?: boolean
  rarity?: string
}

export interface SearchResponse {
  suggestions: string[]
  products: Product[]
}

const fuseOptions = {
  keys: [
    { name: "name", weight: 0.6 },
    { name: "category", weight: 0.3 },
    { name: "description", weight: 0.1 },
  ],
  threshold: 0.3, // Lower threshold = more strict matching
  includeMatches: true,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
}

const fuse = new Fuse(productsData, fuseOptions)

export function searchProducts(query: string): Product[] {
  if (!query.trim()) {
    return productsData.slice(0, 10) // Return first 10 products if no query
  }

  const results = fuse.search(query, { limit: 10 })
  return results.map((result) => result.item)
}

const RECENT_SEARCHES_KEY = "tcg_recent_searches"
const MAX_RECENT_SEARCHES = 5

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error reading recent searches:", error)
    return []
  }
}

export function saveSearchQuery(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return

  try {
    const recent = getRecentSearches()
    const trimmedQuery = query.trim()

    // Remove if already exists
    const filtered = recent.filter((search) => search.toLowerCase() !== trimmedQuery.toLowerCase())

    // Add to beginning
    const updated = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES)

    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Error saving search query:", error)
  }
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  } catch (error) {
    console.error("Error clearing recent searches:", error)
  }
}

export function getSearchSuggestions(query: string, limit = 5): SearchResponse {
  if (!query.trim()) return { suggestions: [], products: [] }

  // Synchronous Fuse.js fallback (uses stale products.json — kept as instant fallback)
  const results = fuse.search(query, { limit })
  const suggestions = new Set<string>()

  results.forEach((result) => {
    if (result.item.name.toLowerCase().includes(query.toLowerCase())) {
      suggestions.add(result.item.name)
    }
    if (result.item.category.toLowerCase().includes(query.toLowerCase())) {
      suggestions.add(result.item.category)
    }
  })

  return {
    suggestions: Array.from(suggestions).slice(0, limit),
    products: results.slice(0, 4).map(r => r.item)
  }
}

/**
 * Async variant that fetches live suggestions from Neon via /api/search.
 * Falls back to the synchronous Fuse.js getSearchSuggestions on error.
 */
export async function getLiveSuggestions(query: string, limit = 5): Promise<SearchResponse> {
  if (!query.trim() || query.trim().length < 2) return { suggestions: [], products: [] }

  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      { signal: AbortSignal.timeout(3000) } // 3-second timeout — keeps the UI snappy
    )
    if (!res.ok) throw new Error("API error")
    const data = await res.json() as SearchResponse
    return {
      suggestions: data.suggestions ?? [],
      products: data.products ?? []
    }
  } catch {
    // Graceful fallback to local Fuse.js so the dropdown never breaks
    return getSearchSuggestions(query, limit)
  }
}


export function getAllProducts(): Product[] {
  return productsData
}

export function getProductsByCategory(category: string): Product[] {
  if (category === "All Categories") return productsData
  return productsData.filter((product) => product.category === category)
}
