"use server"

import { revalidatePath } from "next/cache"
import { neon } from "@neondatabase/serverless"

function getSqlConnection() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING
  if (!url) throw new Error("No database connection string. Please check your environment variables.")
  return neon(url)
}

/**
 * Checks if the external payment gateway is enabled in the database.
 */
export async function getPaymentGatewayStatus() {
  const sql = getSqlConnection()
  const result = await sql`SELECT value FROM store_settings WHERE key = 'PAYMENT_GATEWAY_ENABLED'`
  
  if (result.length === 0) {
    // Default to true if not configured
    return true
  }
  
  return result[0].value === "true"
}

/**
 * Toggles the gateway switch in the database.
 */
export async function togglePaymentGateway(enabled: boolean) {
  const sql = getSqlConnection()
  const val = enabled.toString()
  const desc = "Controls whether the Payment Gateway method is visible on Checkout."
  
  await sql`
    INSERT INTO store_settings (key, value, description, updated_at) 
    VALUES ('PAYMENT_GATEWAY_ENABLED', ${val}, ${desc}, NOW())
    ON CONFLICT (key) 
    DO UPDATE SET value = ${val}, description = ${desc}, updated_at = NOW()
  `

  // Revalidate the checkout and settings paths so UI updates instantly
  revalidatePath("/checkout")
  revalidatePath("/admin/settings/payments")
  
  return { success: true, enabled }
}
