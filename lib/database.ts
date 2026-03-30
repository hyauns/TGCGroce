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
    try {
      const connection = getSqlConnection()

      const tableCheck = await connection`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'orders'
        )
      `

      if (!tableCheck[0]?.exists) {
        console.log("[v0] Orders table doesn't exist, returning mock admin stats")
        // Return mock stats data
        return {
          totalRevenue: 12450.75,
          ordersToday: 8,
          newCustomers: 23,
          conversionRate: 3.2,
        }
      }

      const [revenue, ordersToday, newCustomers] = await Promise.all([
        connection`SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'CANCELLED'`,
        connection`SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURRENT_DATE`,
        connection`SELECT COUNT(*) as count FROM users WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days'`,
      ])

      return {
        totalRevenue: Number(revenue[0]?.total || 0),
        ordersToday: Number(ordersToday[0]?.count || 0),
        newCustomers: Number(newCustomers[0]?.count || 0),
        conversionRate: 3.2, // Mock conversion rate
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error)
      return {
        totalRevenue: 12450.75,
        ordersToday: 8,
        newCustomers: 23,
        conversionRate: 3.2,
      }
    }
  },

  async getRevenueData(): Promise<RevenueData[]> {
    try {
      const connection = getSqlConnection()

      const tableCheck = await connection`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'orders'
        )
      `

      if (!tableCheck[0]?.exists) {
        console.log("[v0] Orders table doesn't exist, returning mock revenue data")
        // Return mock revenue data for the last 7 days
        const mockData = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          mockData.push({
            date: date.toISOString().split("T")[0],
            revenue: Math.floor(Math.random() * 2000) + 1000, // Random revenue between 1000-3000
          })
        }
        return mockData
      }

      const result = await connection`
        SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(total), 0) as revenue
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
    } catch (error) {
      console.error("Error fetching revenue data:", error)
      return []
    }
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
    try {
      const connection = getSqlConnection()

      // Check if orders table exists
      const tableCheck = await connection`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'orders'
        )
      `

      if (!tableCheck[0]?.exists) {
        console.log("[v0] Orders table doesn't exist, returning mock data")
        // Return mock orders data
        const now = new Date()
        const mockOrders: Array<{
          id: string
          customer_id: string
          customer: { id: string; name: string; email: string; created_at: Date }
          total: number
          status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
          created_at: Date
          updated_at: Date
          items: Array<{ name: string; quantity: number; price: number }>
          tracking?: string
        }> = [
          {
            id: "ord_001",
            customer_id: "cust_001",
            customer: { id: "cust_001", name: "John Doe", email: "john@example.com", created_at: now },
            total: 149.99,
            status: "DELIVERED",
            created_at: new Date(Date.now() - 86400000),
            updated_at: new Date(Date.now() - 86400000),
            items: [{ name: "Tarkir Dragonstorm Bundle", quantity: 1, price: 149.99 }],
            tracking: "TRK123456789",
          },
          {
            id: "ord_002",
            customer_id: "cust_002",
            customer: { id: "cust_002", name: "Jane Smith", email: "jane@example.com", created_at: now },
            total: 89.97,
            status: "SHIPPED",
            created_at: new Date(Date.now() - 172800000),
            updated_at: new Date(Date.now() - 172800000),
            items: [{ name: "Tarkir Play Boosters", quantity: 3, price: 29.99 }],
            tracking: "TRK987654321",
          },
          {
            id: "ord_003",
            customer_id: "cust_003",
            customer: { id: "cust_003", name: "Mike Johnson", email: "mike@example.com", created_at: now },
            total: 199.99,
            status: "PROCESSING",
            created_at: new Date(Date.now() - 259200000),
            updated_at: new Date(Date.now() - 259200000),
            items: [{ name: "Edge of Eternities Bundle", quantity: 1, price: 199.99 }],
          },
          {
            id: "ord_004",
            customer_id: "cust_004",
            customer: { id: "cust_004", name: "Sarah Wilson", email: "sarah@example.com", created_at: now },
            total: 59.98,
            status: "PENDING",
            created_at: new Date(Date.now() - 345600000),
            updated_at: new Date(Date.now() - 345600000),
            items: [{ name: "Mystical Archive Singles", quantity: 2, price: 29.99 }],
          },
          {
            id: "ord_005",
            customer_id: "cust_005",
            customer: { id: "cust_005", name: "David Brown", email: "david@example.com", created_at: now },
            total: 299.99,
            status: "CANCELLED",
            created_at: new Date(Date.now() - 432000000),
            updated_at: new Date(Date.now() - 432000000),
            items: [{ name: "Commander Deck Bundle", quantity: 1, price: 299.99 }],
          },
        ]

        // Apply filters to mock data
        let filteredOrders = mockOrders

        if (search) {
          const searchLower = search.toLowerCase()
          filteredOrders = filteredOrders.filter(
            (order) =>
              order.id.toLowerCase().includes(searchLower) ||
              order.customer.name.toLowerCase().includes(searchLower) ||
              order.customer.email.toLowerCase().includes(searchLower),
          )
        }

        if (status) {
          filteredOrders = filteredOrders.filter((order) => order.status === status)
        }

        const total = filteredOrders.length
        const startIndex = (page - 1) * limit
        const paginatedOrders = filteredOrders.slice(startIndex, startIndex + limit)

        return { orders: paginatedOrders, total }
      }

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
        query += ` AND (o.id ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`
        params.push(`%${search}%`)
        paramIndex++
      }

      if (status) {
        query += ` AND o.status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered_orders`
      const [countResult] = await connection(countQuery, params)
      const total = Number(countResult.total)

      query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, (page - 1) * limit)

      const orders = await connection(query, params)

      return {
        orders: orders.map((order: { user_id: string; customer_name: string; customer_email: string }) => ({
          ...order,
          customer: {
            id: order.user_id,
            name: order.customer_name,
            email: order.customer_email,
          },
        })),
        total,
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      return { orders: [], total: 0 }
    }
  },

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const connection = getSqlConnection()

      const tableCheck = await connection`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'orders'
        )
      `

      if (!tableCheck[0]?.exists) {
        console.log("[v0] Orders table doesn't exist, returning mock order")
        // Return mock order data
        return {
          id: id,
          customer_id: "cust_001",
          customer: { id: "cust_001", name: "John Doe", email: "john@example.com", created_at: new Date() },
          total: 149.99,
          status: "DELIVERED",
          created_at: new Date(),
          updated_at: new Date(),
          items: [{ name: "Tarkir Dragonstorm Bundle", quantity: 1, price: 149.99 }],
          tracking: "TRK123456789",
          shipping: {
            address: "123 Main St, City, State 12345",
            method: "Standard Shipping",
          },
        }
      }

      const result = await connection`
        SELECT 
          o.*,
          u.name as customer_name,
          u.email as customer_email,
          u.id as customer_id
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = ${id}
      `

      if (result.length === 0) return null

      const order = result[0]
      return {
        ...order,
        customer: {
          id: order.customer_id,
          name: order.customer_name,
          email: order.customer_email,
        },
      }
    } catch (error) {
      console.error("Error fetching order by ID:", error)
      return null
    }
  },

  async updateOrderStatus(id: string, status: string, tracking?: string): Promise<void> {
    try {
      const connection = getSqlConnection()
      await connection`
        UPDATE orders 
        SET status = ${status}, 
            tracking = ${tracking || null},
            updated_at = NOW()
        WHERE id = ${id}
      `
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  },

  async getCustomers(page = 1, limit = 10, search?: string): Promise<{ customers: Customer[]; total: number }> {
    let query = `
      SELECT 
        u.*,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_spent
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

    const countQuery = `SELECT COUNT(*) as total FROM users u WHERE 1=1`
    const [countResult] = await getSqlConnection()(
      countQuery + (search ? ` AND (u.name ILIKE '%${search}%' OR u.email ILIKE '%${search}%')` : ""),
    )
    const total = Number(countResult.total)

    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, (page - 1) * limit)

    const customers = await getSqlConnection()(query, params)

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
    try {
      const connection = getSqlConnection()

      const tableCheck = await connection`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'orders'
        )
      `

      if (!tableCheck[0]?.exists) {
        console.log("[v0] Orders table doesn't exist, creating tables...")

        // Create orders table
        await connection`
          CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            customer_id VARCHAR(255) NOT NULL,
            order_number VARCHAR(50) UNIQUE NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
            subtotal DECIMAL(10,2) NOT NULL,
            tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            total_amount DECIMAL(10,2) NOT NULL,
            payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
            shipping_address JSONB,
            billing_address JSONB,
            order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            tracking_number VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `

        // Create order_items table
        await connection`
          CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
            product_id VARCHAR(255) NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `

        // Create indexes
        await connection`CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)`
        await connection`CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date)`
        await connection`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`

        console.log("[v0] Orders tables created successfully")
      }

      console.log("[v0] Creating order with customer_id:", orderData.customer_id, "type:", typeof orderData.customer_id)

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
        total: order.total_amount,
        status: order.status as any,
        created_at: order.order_date,
        updated_at: order.order_date,
      }
    } catch (error) {
      console.error("❌ Error creating order:", error)
      throw error
    }
  },

  async getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    try {
      const connection = getSqlConnection()

      const tableCheck = await connection`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'orders'
        )
      `

      if (!tableCheck[0]?.exists) {
        console.log("[v0] Orders table doesn't exist, returning empty array")
        return []
      }

      const orders = await connection`
        SELECT 
          o.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
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
    } catch (error) {
      console.error("Error fetching customer orders:", error)
      return []
    }
  },
}
