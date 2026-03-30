-- Create analytics tables for TCG store
-- This script sets up the core tables needed for analytics reporting

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Renamed to analytics_orders to avoid conflict with main orders table
CREATE TABLE IF NOT EXISTS analytics_orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shipped_date TIMESTAMP WITH TIME ZONE,
  delivered_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Renamed to analytics_order_items to match renamed table
CREATE TABLE IF NOT EXISTS analytics_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES analytics_orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Website analytics table for conversion funnel
CREATE TABLE IF NOT EXISTS website_analytics (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL, -- 'page_view', 'add_to_cart', 'checkout_start', 'purchase'
  page_url VARCHAR(500),
  product_id INTEGER REFERENCES products(id),
  customer_id INTEGER REFERENCES customers(id),
  event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for better query performance
-- Updated index names to match renamed tables
CREATE INDEX IF NOT EXISTS idx_analytics_orders_order_date ON analytics_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_analytics_orders_customer_id ON analytics_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_analytics_order_items_product_id ON analytics_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_website_analytics_event_type ON website_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_website_analytics_event_date ON website_analytics(event_date);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
