import { getServerEnv } from "@/lib/env"

export interface TaxCalculationParams {
  amount: number
  shipping: number
  toZip: string
  toState: string
  toCity: string
  toCountry?: string
}

/**
 * Calls the TaxJar API to fetch real-time sales tax amounts.
 * If the API fails, encounters invalid data, or falls out of jurisdiction,
 * it safely catches the error and defaults to 0 to prevent blocking the checkout.
 */
export async function calculateSalesTax({
  amount,
  shipping,
  toZip,
  toState,
  toCity,
  toCountry = "US"
}: TaxCalculationParams): Promise<number> {
  // Gracefully fallback to 0 outside the US
  if (toCountry !== "US") {
    return 0
  }

  try {
    const { TAXJAR_API_KEY } = getServerEnv()

    const response = await fetch("https://api.taxjar.com/v2/taxes", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TAXJAR_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // Minimal valid payload for accurate destination-based nexus
        to_country: toCountry,
        to_zip: toZip,
        to_state: toState,
        to_city: toCity,
        amount: amount,
        shipping: shipping
      })
    })

    if (!response.ok) {
      // e.g. 400 Bad Request on completely invalid zip code formatting
      const errorText = await response.text()
      throw new Error(`TaxJar returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    
    // TaxJar v2/taxes returns { tax: { amount_to_collect: 1.25, ... } }
    const taxAmount = Number(data?.tax?.amount_to_collect)
    
    if (isNaN(taxAmount)) {
      throw new Error("Invalid response format from TaxJar")
    }

    return taxAmount

  } catch (error) {
    // Log heavily but fallback securely to $0 so high-intent buyers aren't dropped
    console.error("[Tax Service] Failed to calculate real-time tax:", error)
    return 0
  }
}
