import { neon } from "@neondatabase/serverless"

let sql: any = null

const getSqlConnection = () => {
  if (!sql) {
    const url =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.POSTGRES_URL_NON_POOLING

    if (!url) {
      throw new Error("No database connection string found. Please check your environment variables.")
    }

    sql = neon(url)
  }
  return sql
}

export interface Customer {
  id: string
  email: string
  name: string
  phone?: string
  address?: any
  created_at: Date
  total_orders?: number
  total_spent?: number
}

export interface Order {
  id: string
  customer_id: string
  customer?: Customer
  items: any[]
  total: number
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
  shipping?: any
  tracking?: string
  created_at: Date
  updated_at: Date
}

export interface AdminStats {
  totalRevenue: number
  ordersToday: number
  newCustomers: number
  conversionRate: number
}

export interface RevenueData {
  date: string
  revenue: number
}

export interface TopProduct {
  id: string
  name: string
  sales: number
  revenue: number
}

export interface OrderItem {
  id: string
  product_id: string
  name: string
  price: number
  quantity: number
  total_price: number
}

export interface CreateOrderData {
  customer_id: string
  order_number: string
  status: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  total_amount: number
  payment_status: string
  items: OrderItem[]
  shipping_address?: any
  billing_address?: any
}

export const adminDb = {
  async getStats(): Promise<AdminStats> {
    const connection = getSqlConnection()

    const [revenue, ordersToday, newCustomers] = await Promise.all([
      connection`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != 'CANCELLED'`,
      connection`SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURRENT_DATE`,
      connection`SELECT COUNT(*) as count FROM users WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days'`,
    ])

    return {
      totalRevenue: Number(revenue[0]?.total || 0),
      ordersToday: Number(ordersToday[0]?.count || 0),
      newCustomers: Number(newCustomers[0]?.count || 0),
      conversionRate: 3.2, // Placeholder — requires analytics integration
    }
  },

  async getRevenueData(): Promise<RevenueData[]> {
    const connection = getSqlConnection()

    const result = await connection`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND status != 'CANCELLED'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `

    return result.map((row: { date: string; revenue: string }) => ({
      date: row.date,
      revenue: Number(row.revenue),
    }))
  },

  async getTopProducts(): Promise<TopProduct[]> {
    // Mock data since products are in JSON
    return [
      { id: "1", name: "Tarkir Dragonstorm Bundle", sales: 45, revenue: 2250 },
      { id: "2", name: "Edge of Eternities Bundle", sales: 32, revenue: 1600 },
      { id: "3", name: "Tarkir Play Boosters", sales: 28, revenue: 840 },
    ]
  },

  async getOrders(page = 1, limit = 10, search?: string, status?: string): Promise<{ orders: Order[]; total: number }> {
    const connection = getSqlConnection()

    let query = `
      SELECT 
        o.*,
        u.name as customer_name,
        u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    if (search) {
      query += ` AND (o.order_number ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (status) {
      query += ` AND o.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered_orders`
    const countResult = await connection.unsafe(countQuery, params)
    const total = Number(countResult[0]?.total || 0)

    query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, (page - 1) * limit)

    const orders = await connection.unsafe(query, params)

    return {
      orders: orders.map((order: { user_id: string; customer_name: string; customer_email: string; total_amount: string }) => ({
        ...order,
        total: Number(order.total_amount),
        customer: {
          id: order.user_id,
          name: order.customer_name,
          email: order.customer_email,
        },
      })),
      total,
    }
  },

  async getOrderById(id: string): Promise<Order | null> {
    const connection = getSqlConnection()

    const result = await connection`
      SELECT 
        o.*,
        u.name as customer_name,
        u.email as customer_email,
        u.id as customer_user_id
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ${id}
    `

    if (result.length === 0) return null

    const order = result[0]
    return {
      ...order,
      total: Number(order.total_amount),
      customer: {
        id: order.customer_user_id ?? order.customer_id,
        name: order.customer_name,
        email: order.customer_email,
      },
    }
  },

  async updateOrderStatus(id: string, status: string, tracking?: string): Promise<void> {
    const connection = getSqlConnection()
    await connection`
      UPDATE orders 
      SET status = ${status}, 
          tracking_number = ${tracking || null},
          updated_at = NOW()
      WHERE id = ${id}
    `
  },

  async getCustomers(page = 1, limit = 10, search?: string): Promise<{ customers: Customer[]; total: number }> {
    const connection = getSqlConnection()

    let query = `
      SELECT 
        u.*,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    if (search) {
      query += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    query += ` GROUP BY u.id`

    // Count query — parameterized to avoid SQL injection
    let countQuery = `SELECT COUNT(*) as total FROM users u WHERE 1=1`
    const countParams: any[] = []
    if (search) {
      countQuery += ` AND (u.name ILIKE $1 OR u.email ILIKE $1)`
      countParams.push(`%${search}%`)
    }
    const countResult = await connection.unsafe(countQuery, countParams)
    const total = Number(countResult[0]?.total || 0)

    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, (page - 1) * limit)

    const customers = await connection.unsafe(query, params)

    return {
      customers: customers.map((customer: { total_orders: string; total_spent: string }) => ({
        ...customer,
        total_orders: Number(customer.total_orders),
        total_spent: Number(customer.total_spent),
      })),
      total,
    }
  },

  async createOrder(orderData: CreateOrderData): Promise<Order> {
    const connection = getSqlConnection()

    // Ensure customer_id is a string (for both authenticated users and guests)
    const customerId = String(orderData.customer_id)

    // Insert order
    const [order] = await connection`
      INSERT INTO orders (
        customer_id, order_number, status, subtotal, tax_amount, 
        shipping_amount, total_amount, payment_status, shipping_address, 
        billing_address, order_date
      ) VALUES (
        ${customerId}, ${orderData.order_number}, ${orderData.status},
        ${orderData.subtotal}, ${orderData.tax_amount}, ${orderData.shipping_amount},
        ${orderData.total_amount}, ${orderData.payment_status}, 
        ${JSON.stringify(orderData.shipping_address)}, 
        ${JSON.stringify(orderData.billing_address)}, NOW()
      )
      RETURNING *
    `

    // Insert order items
    if (orderData.items && orderData.items.length > 0) {
      for (const item of orderData.items) {
        await connection`
          INSERT INTO order_items (
            order_id, product_id, product_name, quantity, unit_price, total_price
          ) VALUES (
            ${order.id}, ${item.product_id || item.id}, ${item.name}, ${item.quantity}, 
            ${item.price}, ${item.total_price}
          )
        `
      }
    }

    console.log(`✅ Order ${orderData.order_number} saved to database with ${orderData.items?.length || 0} items`)

    return {
      id: order.id.toString(),
      customer_id: order.customer_id,
      items: orderData.items,
      total: Number(order.total_amount),
      status: order.status as any,
      created_at: order.order_date,
      updated_at: order.order_date,
    }
  },

  async getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    const connection = getSqlConnection()

    const orders = await connection`
      SELECT 
        o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price
            )
          ) FILTER (WHERE oi.id IS NOT NULL), 
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = ${customerId}
      GROUP BY o.id
      ORDER BY o.order_date DESC
    `

    return orders.map((order: { id: { toString: () => string }; customer_id: string; items?: unknown[]; total_amount: string; status: string; order_date: Date; tracking_number?: string }) => ({
      id: order.id.toString(),
      customer_id: order.customer_id,
      items: order.items || [],
      total: Number(order.total_amount),
      status: order.status as "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED",
      created_at: order.order_date,
      updated_at: order.order_date,
      tracking: order.tracking_number,
    }))
  },
}
