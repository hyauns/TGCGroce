"use server"

import { neon } from "@neondatabase/serverless"
import { revalidatePath } from "next/cache"

const sql = neon(process.env.DATABASE_URL!)

export async function updateAdminProductAction(data: any) {
  try {
    const {
      id,
      name,
      image_url,
      upc,
      price,
      original_price,
      stock_quantity,
      description,
      category,
      is_active,
      is_featured,
      is_pre_order,
      release_date, // Can be null, undefined, or string
    } = data

    if (!id) {
      return { success: false, error: "Product ID is missing" }
    }

    // Convert date carefully
    let releaseDateStr = null
    if (release_date) {
      const d = new Date(release_date)
      if (!isNaN(d.getTime())) {
        releaseDateStr = d.toISOString().split("T")[0] // YYYY-MM-DD
      }
    }

    await sql`
      UPDATE products 
      SET 
        name = ${name},
        image_url = ${image_url || null},
        upc = ${upc || null},
        price = ${price},
        original_price = ${original_price || null},
        stock_quantity = ${stock_quantity || 0},
        description = ${description || null},
        category = ${category || null},
        is_active = ${is_active},
        is_featured = ${is_featured},
        is_pre_order = ${is_pre_order},
        release_date = ${releaseDateStr ? sql`${releaseDateStr}::DATE` : null},
        updated_at = NOW()
      WHERE id = ${id}
    `

    revalidatePath("/admin/products")
    revalidatePath("/products")
    revalidatePath("/")

    return { success: true }
  } catch (error: any) {
    console.error("Failed to update product:", error)
    return { success: false, error: error.message || "Failed to update product" }
  }
}
