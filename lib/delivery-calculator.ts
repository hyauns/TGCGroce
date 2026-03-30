export interface DeliveryOption {
  id: string
  name: string
  description: string
  minDays: number
  maxDays: number
  price: number
  icon: string
  color: string
  popular?: boolean
}

export interface DeliveryInfo {
  estimatedDate: Date
  businessDays: number
  adjustedPrice: number
  originalPrice: number
  savings: number
}

// Mock shipping options
export const getShippingOptions = (orderValue = 0): DeliveryOption[] => [
  {
    id: "economy",
    name: "Economy Shipping",
    description: "Standard delivery with tracking",
    minDays: 5,
    maxDays: 8,
    price: orderValue >= 75 ? 0 : 6.99,
    icon: "📦",
    color: "from-blue-500 to-blue-600",
    popular: false,
  },
  {
    id: "standard",
    name: "Standard Shipping",
    description: "Reliable delivery with insurance",
    minDays: 3,
    maxDays: 5,
    price: orderValue >= 75 ? 0 : 9.99,
    icon: "🚚",
    color: "from-green-500 to-green-600",
    popular: true,
  },
  {
    id: "express",
    name: "Express Shipping",
    description: "Fast delivery for urgent orders",
    minDays: 1,
    maxDays: 2,
    price: 19.99,
    icon: "⚡",
    color: "from-orange-500 to-red-500",
    popular: false,
  },
]

// Validate ZIP code
export const validateZipCode = (zipCode: string): boolean => {
  const zipRegex = /^\d{5}(-\d{4})?$/
  return zipRegex.test(zipCode.trim())
}

// Get regional adjustment based on ZIP code
export const getRegionalAdjustment = (zipCode: string): number => {
  const firstDigit = Number.parseInt(zipCode.charAt(0))

  // Simulate regional delivery adjustments
  if (firstDigit >= 9) return 1 // West Coast
  if (firstDigit >= 6) return 0 // Central
  if (firstDigit >= 3) return 0 // East Coast
  return 1 // Remote areas
}

// Calculate delivery date range
export const calculateDeliveryRange = (orderDate: Date, minDays: number, maxDays: number, processingDays = 1) => {
  const startDate = new Date(orderDate)
  startDate.setDate(startDate.getDate() + processingDays)

  let businessDaysAdded = 0
  let currentDate = new Date(startDate)

  // Calculate minimum delivery date
  while (businessDaysAdded < minDays) {
    currentDate.setDate(currentDate.getDate() + 1)
    const dayOfWeek = currentDate.getDay()

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDaysAdded++
    }
  }

  const minDate = new Date(currentDate)

  // Calculate maximum delivery date
  businessDaysAdded = 0
  currentDate = new Date(startDate)

  while (businessDaysAdded < maxDays) {
    currentDate.setDate(currentDate.getDate() + 1)
    const dayOfWeek = currentDate.getDay()

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDaysAdded++
    }
  }

  const maxDate = new Date(currentDate)

  // Estimated date is the minimum date
  const estimatedDate = new Date(minDate)

  return { minDate, maxDate, estimatedDate }
}

// Format delivery date
export const formatDeliveryDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

// Format delivery range
export const formatDeliveryRange = (minDate: Date, maxDate: Date): string => {
  const minFormatted = formatDeliveryDate(minDate)
  const maxFormatted = formatDeliveryDate(maxDate)

  if (minFormatted === maxFormatted) {
    return `Arrives ${minFormatted}`
  }

  return `Arrives ${minFormatted} - ${maxFormatted}`
}

// Main calculation function
export const calculateDelivery = (zipCode: string, orderValue: number, isPreOrder = false, preOrderDate?: string) => {
  const shippingOptions = getShippingOptions(orderValue)
  const orderDate = isPreOrder && preOrderDate ? new Date(preOrderDate) : new Date()
  const regionalAdjustment = getRegionalAdjustment(zipCode)

  return shippingOptions.map((option) => {
    const adjustedMinDays = option.minDays + regionalAdjustment
    const adjustedMaxDays = option.maxDays + regionalAdjustment

    const deliveryInfo = calculateDeliveryRange(orderDate, adjustedMinDays, adjustedMaxDays)

    // Calculate pricing
    let adjustedPrice = option.price
    const originalPrice = option.price
    let savings = 0

    // Apply free shipping for orders over $75
    if (orderValue >= 75 && (option.id === "economy" || option.id === "standard")) {
      savings = originalPrice
      adjustedPrice = 0
    }

    // Add regional surcharge for remote areas
    if (regionalAdjustment > 0 && adjustedPrice > 0) {
      adjustedPrice += 2.99
    }

    return {
      option: {
        ...option,
        minDays: adjustedMinDays,
        maxDays: adjustedMaxDays,
      },
      deliveryInfo: {
        ...deliveryInfo,
        businessDays: adjustedMinDays,
        adjustedPrice,
        originalPrice,
        savings,
      },
    }
  })
}
