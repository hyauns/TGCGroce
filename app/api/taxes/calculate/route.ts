import { type NextRequest, NextResponse } from "next/server"
import { calculateSalesTax } from "@/lib/tax"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, shipping, toZip, toState, toCity, toCountry } = body

    // Enforce required fields for Nexus bounds calculation
    if (!amount || !toZip) {
      return NextResponse.json({ taxAmount: 0 }, { status: 400 })
    }

    const numericAmount = Number(amount)
    const numericShipping = Number(shipping || 0)

    const taxAmount = await calculateSalesTax({
      amount: numericAmount,
      shipping: numericShipping,
      toZip,
      toState: toState || "",
      toCity: toCity || "",
      toCountry: toCountry || "US"
    })

    console.log(`[Tax API] ZIP received: ${toZip} -> Tax calculated: ${taxAmount}`)

    return NextResponse.json({ taxAmount })
  } catch (error) {
    console.error(`[Tax API] Failed to calculate tax fallback injected:`, error)
    return NextResponse.json({ taxAmount: 0 }, { status: 500 })
  }
}
