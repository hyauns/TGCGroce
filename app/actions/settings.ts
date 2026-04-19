"use server"

import { revalidatePath } from "next/cache"
import { PrismaClient } from "@/lib/generated/prisma"

const prisma = new PrismaClient()

/**
 * Checks if the external payment gateway is enabled in the database.
 */
export async function getPaymentGatewayStatus() {
  const setting = await prisma.store_settings.findUnique({
    where: { key: "PAYMENT_GATEWAY_ENABLED" }
  })
  
  if (!setting) {
    // Default to true if not configured
    return true
  }
  
  return setting.value === "true"
}

/**
 * Toggles the gateway switch in the database.
 */
export async function togglePaymentGateway(enabled: boolean) {
  await prisma.store_settings.upsert({
    where: { key: "PAYMENT_GATEWAY_ENABLED" },
    update: { 
      value: enabled.toString(),
      description: "Controls whether the Payment Gateway method is visible on Checkout."
    },
    create: {
      key: "PAYMENT_GATEWAY_ENABLED",
      value: enabled.toString(),
      description: "Controls whether the Payment Gateway method is visible on Checkout."
    }
  })

  // Revalidate the checkout and settings paths so UI updates instantly
  revalidatePath("/checkout")
  revalidatePath("/admin/settings/payments")
  
  return { success: true, enabled }
}
