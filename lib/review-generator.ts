/**
 * Review Generator
 * Generates realistic fake reviews for products to enhance appeal
 */

interface ReviewGenerationFactors {
  productId: number
  productName: string
  category: string
  price: number
  rating: number
  isNew?: boolean
  isHot?: boolean
  isPreOrder?: boolean
}

export interface GeneratedReview {
  id: number
  userName: string
  rating: number
  title: string
  comment: string
  date: string
  verified: boolean
  helpful: number
  images?: string[]
  purchaseType?: string
}

/** Shape of a real review row fetched from the product_reviews table. */
export interface DbReview {
  id: string               // UUID
  product_id: number
  customer_id: number | null
  rating: number
  title: string | null
  review_text: string
  is_verified_purchase: boolean
  created_at: string       // ISO string
  /** Resolved display name — filled by the API join; absent on anonymous reviews. */
  reviewer_name: string | null
}


// Realistic usernames pool
const USERNAME_PREFIXES = [
  "CardCollector",
  "TCGMaster",
  "GamePlayer",
  "CollectorPro",
  "CardFan",
  "DeckBuilder",
  "TradingCard",
  "CardHunter",
  "GameNinja",
  "PlayMaster",
  "CardWiz",
  "DuelMaster",
  "PackOpener",
  "CardGuru",
  "GameLord",
  "TradeMaster",
  "CardShark",
  "PlayPro",
  "CollectAll",
  "CardKing",
  "GameHero",
  "TradePro",
  "CardBoss",
  "PlayLegend",
]

const USERNAME_SUFFIXES = [
  "2024",
  "2023",
  "Pro",
  "Master",
  "Elite",
  "Prime",
  "X",
  "Gaming",
  "Cards",
  "TCG",
  "Collector",
  "Player",
  "Fan",
  "Lover",
  "Addict",
  "Enthusiast",
  "Expert",
  "Guru",
  "Legend",
  "Champion",
  "Ace",
  "Star",
  "Hero",
  "Wizard",
]

// Review templates by category
const REVIEW_TEMPLATES = {
  "Pokemon TCG": {
    positive: [
      "Amazing pull rates! Got some incredible cards from this {product}.",
      "Perfect condition cards and fast shipping. Exactly what I expected from Pokemon.",
      "Great value for money. The cards arrived in mint condition.",
      "Love the artwork and quality. Pokemon never disappoints!",
      "Excellent booster pack with some rare finds. Highly recommend!",
      "Fast delivery and authentic cards. Will definitely order again.",
      "Perfect for my collection. The packaging was secure and professional.",
    ],
    neutral: [
      "Good product overall. Cards were in decent condition.",
      "Standard Pokemon quality. Nothing exceptional but solid.",
      "Fair value for the price. Got what I expected.",
      "Decent pull rates, though could have been better.",
    ],
    negative: [
      "Expected better pull rates for the price.",
      "Cards were okay but packaging could be improved.",
      "Not the best value compared to other options.",
    ],
  },
  "Magic: The Gathering": {
    positive: [
      "Incredible cards for my Commander deck! Perfect condition and fast shipping.",
      "Amazing quality as always from MTG. The artwork is stunning.",
      "Great addition to my collection. Cards arrived quickly and well-packaged.",
      "Perfect for drafting with friends. Excellent card quality.",
      "Love the new mechanics in this set. Highly recommend for any MTG player.",
      "Authentic cards and great customer service. Will order again!",
      "Excellent value and the cards are tournament-ready.",
    ],
    neutral: [
      "Standard MTG quality. Good for casual play.",
      "Decent cards for the price point.",
      "Fair value, though shipping took a bit longer than expected.",
    ],
    negative: ["Expected more value cards for the price.", "Cards were fine but nothing special in the pulls."],
  },
  "Yu-Gi-Oh!": {
    positive: [
      "Perfect for my deck build! Got some great cards for competitive play.",
      "Excellent condition and authentic Yu-Gi-Oh cards. Very satisfied!",
      "Great pulls and fast shipping. Exactly what I needed for my collection.",
      "Amazing artwork and card quality. Yu-Gi-Oh never fails to impress.",
      "Perfect for tournament play. Cards arrived in mint condition.",
      "Great value and authentic products. Highly recommend this seller!",
      "Fast delivery and secure packaging. Will definitely buy again.",
    ],
    neutral: [
      "Good cards for casual dueling. Standard quality.",
      "Fair value for money. Got what I expected.",
      "Decent addition to my collection.",
    ],
    negative: ["Expected better cards for competitive play.", "Packaging could have been more secure."],
  },
}

// Generic templates for other categories
const GENERIC_TEMPLATES = {
  positive: [
    "Excellent quality and fast shipping! Exactly as described.",
    "Perfect condition and great value for money. Highly recommend!",
    "Amazing product! Arrived quickly and well-packaged.",
    "Great quality and authentic products. Will order again!",
    "Perfect addition to my collection. Very satisfied with the purchase.",
    "Excellent customer service and fast delivery. 5 stars!",
    "High quality product at a fair price. Couldn't be happier!",
  ],
  neutral: [
    "Good product overall. Met my expectations.",
    "Fair value for the price. Standard quality.",
    "Decent product, though shipping took a bit longer.",
  ],
  negative: ["Product was okay but expected better quality.", "Fair product but packaging could be improved."],
}

// Seeded random number generator
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Generate realistic username
const generateUsername = (seed: number): string => {
  const prefixIndex = Math.floor(seededRandom(seed) * USERNAME_PREFIXES.length)
  const suffixIndex = Math.floor(seededRandom(seed + 1) * USERNAME_SUFFIXES.length)

  return `${USERNAME_PREFIXES[prefixIndex]}${USERNAME_SUFFIXES[suffixIndex]}`
}

// Generate review rating based on product rating
const generateReviewRating = (productRating: number, seed: number): number => {
  const random = seededRandom(seed)

  // Higher product ratings should have more 4-5 star reviews
  if (productRating >= 4.5) {
    return random < 0.7 ? 5 : random < 0.9 ? 4 : random < 0.95 ? 3 : random < 0.98 ? 2 : 1
  } else if (productRating >= 4.0) {
    return random < 0.5 ? 5 : random < 0.8 ? 4 : random < 0.9 ? 3 : random < 0.95 ? 2 : 1
  } else if (productRating >= 3.5) {
    return random < 0.3 ? 5 : random < 0.6 ? 4 : random < 0.8 ? 3 : random < 0.9 ? 2 : 1
  } else {
    return random < 0.2 ? 5 : random < 0.4 ? 4 : random < 0.6 ? 3 : random < 0.8 ? 2 : 1
  }
}

// Generate review date (within last 6 months)
const generateReviewDate = (seed: number): string => {
  const daysAgo = Math.floor(seededRandom(seed) * 180) // 0-180 days ago
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split("T")[0]
}

// Generate helpful count
const generateHelpfulCount = (rating: number, seed: number): number => {
  const baseHelpful = rating >= 4 ? 8 : rating >= 3 ? 5 : 2
  const variation = Math.floor(seededRandom(seed) * 10)
  return Math.max(0, baseHelpful + variation - 5)
}

// Generate single review
const generateSingleReview = (factors: ReviewGenerationFactors, reviewIndex: number): GeneratedReview => {
  const seed = factors.productId + reviewIndex * 1000

  const rating = generateReviewRating(factors.rating, seed)
  const userName = generateUsername(seed + 1)
  const date = generateReviewDate(seed + 2)
  const helpful = generateHelpfulCount(rating, seed + 3)

  // Select appropriate template
  const categoryTemplates = REVIEW_TEMPLATES[factors.category as keyof typeof REVIEW_TEMPLATES]
  const templates = categoryTemplates || GENERIC_TEMPLATES

  let selectedTemplate: string
  let title: string

  if (rating >= 4) {
    const positiveTemplates = templates.positive
    selectedTemplate = positiveTemplates[Math.floor(seededRandom(seed + 4) * positiveTemplates.length)]
    title = rating === 5 ? "Excellent product!" : "Great quality and value"
  } else if (rating === 3) {
    const neutralTemplates = templates.neutral || GENERIC_TEMPLATES.neutral
    selectedTemplate = neutralTemplates[Math.floor(seededRandom(seed + 4) * neutralTemplates.length)]
    title = "Good product overall"
  } else {
    const negativeTemplates = templates.negative || GENERIC_TEMPLATES.negative
    selectedTemplate = negativeTemplates[Math.floor(seededRandom(seed + 4) * negativeTemplates.length)]
    title = "Could be better"
  }

  // Replace placeholders
  const comment = selectedTemplate.replace("{product}", factors.productName.toLowerCase())

  // Determine if verified purchase (80% chance)
  const verified = seededRandom(seed + 5) < 0.8

  return {
    id: factors.productId * 1000 + reviewIndex,
    userName,
    rating,
    title,
    comment,
    date,
    verified,
    helpful,
    purchaseType: verified ? "Verified Purchase" : undefined,
  }
}

// Generate realistic review count based on product factors
export const generateReviewCount = (factors: ReviewGenerationFactors): number => {
  const seed = factors.productId

  // Base review count
  let baseCount = 20 + seededRandom(seed) * 100

  // Price influence (cheaper items get more reviews)
  if (factors.price < 25) baseCount *= 2.0
  else if (factors.price < 50) baseCount *= 1.5
  else if (factors.price < 100) baseCount *= 1.2
  else if (factors.price > 200) baseCount *= 0.7

  // Rating influence (better products get more reviews)
  if (factors.rating >= 4.5) baseCount *= 1.8
  else if (factors.rating >= 4.0) baseCount *= 1.5
  else if (factors.rating >= 3.5) baseCount *= 1.2
  else if (factors.rating < 3.0) baseCount *= 0.6

  // Status bonuses
  if (factors.isHot) baseCount *= 2.0
  if (factors.isNew) baseCount *= 1.3
  if (factors.isPreOrder) baseCount *= 0.3

  // Category multipliers
  const categoryMultipliers = {
    "Pokemon TCG": 1.8,
    "Magic: The Gathering": 1.5,
    "Yu-Gi-Oh!": 1.3,
    "Disney Lorcana": 1.1,
    "One Piece Card Game": 1.2,
    "Flesh and Blood": 0.9,
  }

  const multiplier = categoryMultipliers[factors.category as keyof typeof categoryMultipliers] || 1.0
  baseCount *= multiplier

  // Round to realistic number
  const finalCount = Math.max(5, Math.round(baseCount))

  // Cap at reasonable maximum
  return Math.min(finalCount, 500)
}

// Generate multiple reviews for a product
export const generateProductReviews = (factors: ReviewGenerationFactors, count?: number): GeneratedReview[] => {
  const reviewCount = count || generateReviewCount(factors)
  const reviews: GeneratedReview[] = []

  for (let i = 0; i < Math.min(reviewCount, 20); i++) {
    // Limit to 20 displayed reviews
    reviews.push(generateSingleReview(factors, i))
  }

  // Sort by date (newest first)
  return reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Get review summary statistics
export const getReviewSummary = (reviews: GeneratedReview[]) => {
  const totalReviews = reviews.length
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews

  const ratingDistribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  }

  const verifiedCount = reviews.filter((r) => r.verified).length
  const verifiedPercentage = Math.round((verifiedCount / totalReviews) * 100)

  return {
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingDistribution,
    verifiedPercentage,
  }
}

// Format review count for display
export const formatReviewCount = (count: number): string => {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toString()
}
