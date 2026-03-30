/**
 * Sales Count Generator
 * Generates realistic fake sales counts for products to enhance appeal
 */

interface SalesFactors {
  productId: number
  price: number
  category: string
  rating: number
  isNew?: boolean
  isHot?: boolean
  isPreOrder?: boolean
}

interface SalesGeneratorConfig {
  baseMultiplier: number
  categoryMultipliers: { [key: string]: number }
  priceRangeMultipliers: { [key: string]: number }
  timeBasedVariation: number
  randomVariation: number
}

const config: SalesGeneratorConfig = {
  baseMultiplier: 1.0,
  categoryMultipliers: {
    "Magic: The Gathering": 1.8,
    Pokemon: 2.2,
    "Yu-Gi-Oh!": 1.5,
    "Disney Lorcana": 1.3,
    "One Piece Card Game": 1.6,
    "Flesh and Blood": 0.8,
    Accessories: 0.8,
    Supplies: 0.9,
  },
  priceRangeMultipliers: {
    budget: 2.5, // $0-30
    mid: 1.8, // $30-100
    premium: 1.2, // $100-200
    luxury: 0.7, // $200+
  },
  timeBasedVariation: 0.3,
  randomVariation: 0.4,
}

// Category multipliers for sales generation
const CATEGORY_MULTIPLIERS = {
  "Pokemon TCG": 2.2,
  "Magic: The Gathering": 1.8,
  "Yu-Gi-Oh!": 1.5,
  "Disney Lorcana": 1.3,
  "One Piece Card Game": 1.4,
  "Flesh and Blood": 1.1,
  Accessories: 0.8,
  Supplies: 0.9,
} as const

// Price range multipliers
const getPriceMultiplier = (price: number): number => {
  if (price < 10) return 3.0 // Budget items sell more
  if (price < 25) return 2.5
  if (price < 50) return 2.0
  if (price < 100) return 1.5
  if (price < 200) return 1.2
  return 0.8 // Luxury items sell less but still significant
}

// Rating influence on sales
const getRatingMultiplier = (rating: number): number => {
  if (rating >= 4.5) return 1.8
  if (rating >= 4.0) return 1.5
  if (rating >= 3.5) return 1.2
  if (rating >= 3.0) return 1.0
  return 0.7
}

// Time-based variation (changes throughout the day)
const getTimeVariation = (): number => {
  const hour = new Date().getHours()
  const dayOfWeek = new Date().getDay()

  // Weekend boost
  const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1.0

  // Peak hours boost (evening and weekend mornings)
  let hourMultiplier = 1.0
  if (hour >= 18 && hour <= 22)
    hourMultiplier = 1.4 // Evening peak
  else if (hour >= 10 && hour <= 14 && (dayOfWeek === 0 || dayOfWeek === 6)) hourMultiplier = 1.2 // Weekend morning

  return weekendMultiplier * hourMultiplier
}

// Seeded random number generator for consistency
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export const generateRealisticSalesCount = (
  productId: number,
  price: number,
  category: string,
  rating: number,
  isNew = false,
  isHot = false,
  isPreOrder = false,
): number => {
  // Create a seed based on product ID and current date (changes daily)
  const today = new Date().toDateString()
  const seed = productId + today.split("").reduce((a, b) => a + b.charCodeAt(0), 0)

  // Base sales count (varies by product)
  const baseCount = 50 + seededRandom(seed) * 200

  // Apply multipliers
  const categoryMultiplier = CATEGORY_MULTIPLIERS[category as keyof typeof CATEGORY_MULTIPLIERS] || 1.0
  const priceMultiplier = getPriceMultiplier(price)
  const ratingMultiplier = getRatingMultiplier(rating)
  const timeVariation = getTimeVariation()

  // Status bonuses
  let statusMultiplier = 1.0
  if (isHot) statusMultiplier *= 2.5
  if (isNew) statusMultiplier *= 1.8
  if (isPreOrder) statusMultiplier *= 0.6 // Pre-orders typically have lower sales

  // Calculate final count
  let finalCount =
    baseCount * categoryMultiplier * priceMultiplier * ratingMultiplier * statusMultiplier * timeVariation

  // Add some randomness to avoid too many round numbers
  const randomVariation = 0.8 + seededRandom(seed + 1) * 0.4 // 0.8 to 1.2
  finalCount *= randomVariation

  // Ensure minimum sales for popular items
  const minimumSales = rating >= 4.0 ? 100 : 50
  finalCount = Math.max(finalCount, minimumSales)

  // Round to realistic numbers
  if (finalCount < 100) return Math.round(finalCount)
  if (finalCount < 1000) return Math.round(finalCount / 10) * 10
  return Math.round(finalCount / 50) * 50
}

export const formatSalesCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toString()
}

// Analytics functions for reporting
export const generateSalesAnalytics = (products: any[]) => {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    rating: product.rating,
    generatedSales: generateRealisticSalesCount(
      product.id,
      product.price,
      product.category,
      product.rating,
      product.isNew,
      product.isHot,
      product.isPreOrder,
    ),
  }))
}

// Real-time sales update simulation
export const getRealtimeSalesUpdate = (productId: number, currentSales: number): number => {
  const seed = productId + Date.now()
  const shouldUpdate = seededRandom(seed) > 0.95 // 5% chance of update

  if (shouldUpdate) {
    const increment = Math.floor(seededRandom(seed + 1) * 3) + 1 // 1-3 sales
    return currentSales + increment
  }

  return currentSales
}

// Enhanced sales analytics for admin purposes
export function getSalesAnalytics(products: any[]): {
  totalSales: number
  averageSales: number
  topPerformers: any[]
  categoryBreakdown: { [key: string]: number }
} {
  const totalSales = products.reduce((sum, product) => {
    const sales = generateRealisticSalesCount(
      product.id,
      product.price,
      product.category,
      product.rating,
      product.isNew,
      product.isHot,
      product.isPreOrder,
    )
    return sum + sales
  }, 0)

  const averageSales = totalSales / products.length

  const productsWithSales = products.map((product) => ({
    ...product,
    generatedSales: generateRealisticSalesCount(
      product.id,
      product.price,
      product.category,
      product.rating,
      product.isNew,
      product.isHot,
      product.isPreOrder,
    ),
  }))

  const topPerformers = productsWithSales.sort((a, b) => b.generatedSales - a.generatedSales).slice(0, 5)

  const categoryBreakdown = productsWithSales.reduce(
    (acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + product.generatedSales
      return acc
    },
    {} as { [key: string]: number },
  )

  return {
    totalSales,
    averageSales: Math.round(averageSales),
    topPerformers,
    categoryBreakdown,
  }
}

// Hook for real-time sales count updates
export function useRealtimeSalesCount(
  productId: number,
  price: number,
  category: string,
  rating: number,
  isNew = false,
  isHot = false,
  isPreOrder = false,
): number {
  // This could be enhanced with real-time updates via WebSocket
  return generateRealisticSalesCount(productId, price, category, rating, isNew, isHot, isPreOrder)
}
