import productsData from "@/data/products.json"

export interface Product {
  id: number
  name: string
  slug: string
  price: number
  originalPrice?: number
  category: string
  categorySlug?: string
  image: string
  stock?: number
  inStock: boolean
  isPreOrder: boolean
  releaseDate?: string
  isNew?: boolean
  isHot?: boolean
  rating?: number
  reviews?: number
  salesCount?: number
  description?: string
  features?: string[]
  rarity?: string
}

export interface FilterOptions {
  searchTerm?: string
  priceMin?: number
  priceMax?: number
  inStock?: boolean
  outOfStock?: boolean
  isPreOrder?: boolean
  productType?: string
  categories?: string[]
  sortBy?: "price-asc" | "price-desc" | "name-asc" | "name-desc" | "newest"
}

export interface FilterCounts {
  inStock: number
  outOfStock: number
  preOrder: number
  total: number
}

// Cache for expensive operations
let categoriesCache: string[] | null = null
let priceRangeCache: { min: number; max: number } | null = null

export function filterProducts(
  options: FilterOptions = {},
  productsOverride?: Product[],
): Product[] {
  // Use DB products if provided, otherwise fall back to static JSON
  const source = productsOverride
    ? productsOverride.map((p) => ({
        ...p,
        stock: p.stock ?? (p.inStock ? 1 : 0),
      }))
    : (productsData as unknown as Array<{
        id: number
        name: string
        slug: string
        price: number
        originalPrice?: number
        category: string
        image: string
        stock: number
        isPreOrder?: boolean
        isNew?: boolean
        isHot?: boolean
        rating?: number
        reviews?: number
        description: string
      }>).map((p) => ({
        ...p,
        inStock: p.stock > 0,
        isPreOrder: p.isPreOrder ?? false,
      }))

  // Early return if no filters applied
  if (Object.keys(options).length === 0) {
    return sortProducts(source, options.sortBy)
  }

  // Use filter chain for better performance than multiple array iterations
  const filtered = source.filter((product) => {
    if (options.searchTerm) {
      const searchLower = options.searchTerm.toLowerCase()
      const matchesSearch =
        product.name.toLowerCase().includes(searchLower) || product.category.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Price filter - most selective first for early exit
    if (options.priceMin !== undefined && product.price < options.priceMin) return false
    if (options.priceMax !== undefined && product.price > options.priceMax) return false

    // Availability filters
    if (options.inStock && product.stock <= 0) return false
    if (options.outOfStock && product.stock > 0) return false
    if (options.isPreOrder !== undefined && product.isPreOrder !== options.isPreOrder) return false

    // Category filter - use Set for O(1) lookup if multiple categories
    if (options.categories && options.categories.length > 0) {
      const categorySet = new Set(options.categories)
      if (!categorySet.has(product.category)) return false
    }

    return true
  })

  return sortProducts(filtered, options.sortBy)
}

function sortProducts(products: Product[], sortBy?: string): Product[] {
  if (!sortBy) return products

  // Create copy to avoid mutating original array
  const sorted = [...products]

  switch (sortBy) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price)
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price)
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name))
    case "newest":
      return sorted.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
    default:
      return sorted
  }
}

export function getUniqueCategories(productsOverride?: Product[]): string[] {
  if (productsOverride) {
    const categorySet = new Set(productsOverride.map((p) => p.category))
    return Array.from(categorySet).sort()
  }

  if (categoriesCache) return categoriesCache

  const products = (productsData as unknown as Array<{ category: string }>)
  const categorySet = new Set(products.map((p) => p.category))
  categoriesCache = Array.from(categorySet).sort()

  return categoriesCache
}

export function getPriceRange(): { min: number; max: number } {
  if (priceRangeCache) return priceRangeCache

  const products = (productsData as unknown as Array<{ price: number }>)
  const prices = products.map((p) => p.price)

  priceRangeCache = {
    min: Math.min(...prices),
    max: Math.max(...prices),
  }

  return priceRangeCache
}

export function getAvailableCounts(
  currentFilters: FilterOptions = {},
  productsOverride?: Product[],
): FilterCounts {
  // Use DB products if provided, otherwise fall back to static JSON
  const source = productsOverride
    ? productsOverride.map((p) => ({
        price: p.price,
        stock: p.stock ?? (p.inStock ? 1 : 0),
        isPreOrder: p.isPreOrder ?? false,
        category: p.category,
      }))
    : (productsData as unknown as Array<{
        price: number
        stock: number
        isPreOrder?: boolean
        category: string
      }>)

  // Apply non-availability filters first
  const baseFiltered = source.filter((product) => {
    if (currentFilters.priceMin !== undefined && product.price < currentFilters.priceMin) return false
    if (currentFilters.priceMax !== undefined && product.price > currentFilters.priceMax) return false
    if (currentFilters.categories && currentFilters.categories.length > 0) {
      const categorySet = new Set(currentFilters.categories)
      if (!categorySet.has(product.category)) return false
    }
    return true
  })

  return {
    inStock: baseFiltered.filter((p) => p.stock > 0 && !p.isPreOrder).length,
    outOfStock: baseFiltered.filter((p) => p.stock <= 0 && !p.isPreOrder).length,
    preOrder: baseFiltered.filter((p) => p.isPreOrder).length,
    total: baseFiltered.length,
  }
}

export const PRICE_RANGES = [
  { label: "$0 - $50", min: 0, max: 50 },
  { label: "$50 - $100", min: 50, max: 100 },
  { label: "$100 - $200", min: 100, max: 200 },
  { label: "$200 - $300", min: 200, max: 300 },
  { label: "$300 - $500", min: 300, max: 500 },
  { label: "$500+", min: 500, max: Number.POSITIVE_INFINITY },
]

export const SORT_OPTIONS = [
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "newest", label: "Newest First" },
]
