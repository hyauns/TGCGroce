"use server"

import { neon } from "@neondatabase/serverless"

function getSqlConnection() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!url) return null
  return neon(url)
}

export type CartProductDetail = {
  id: number
  stock: number
  isPreOrder: boolean
  releaseDate: string | null
}

export async function getCartProductDetails(productIds: number[]): Promise<Record<number, CartProductDetail>> {
  if (!productIds || productIds.length === 0) return {}

  const sql = getSqlConnection()
  if (!sql) {
    console.error("[getCartProductDetails] No DB connection")
    return {}
  }

  try {
    const rows = await sql`
      SELECT 
        id, 
        stock_quantity, 
        is_pre_order, 
        release_date
      FROM products 
      WHERE id = ANY(${productIds})
    `

    const details: Record<number, CartProductDetail> = {}
    
    rows.forEach((row) => {
      details[row.id] = {
        id: row.id,
        stock: row.stock_quantity,
        isPreOrder: row.is_pre_order,
        releaseDate: row.release_date ? new Date(row.release_date).toISOString().split("T")[0] : null,
      }
    })

    return details
  } catch (error) {
    console.error("[getCartProductDetails] Error fetching details:", error)
    return {}
  }
}
