-- Create orders and order_items tables for the TCG store
-- This script sets up the core tables needed for order processing

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(255) NOT NULL, -- Can be user ID or 'guest'
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
  shipped_date TIMESTAMP WITH TIME ZONE,
  delivered_date TIMESTAMP WITH TIME ZONE,
  tracking_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL, -- Product slug or ID
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Insert a test order to verify the setup
INSERT INTO orders (
  customer_id, order_number, status, subtotal, tax_amount, 
  shipping_amount, total_amount, payment_status
) VALUES (
  'test-customer', 'ORD-TEST-001', 'COMPLETED', 100.00, 8.00, 
  5.99, 113.99, 'PAID'
) ON CONFLICT (order_number) DO NOTHING;

-- Insert test order items
INSERT INTO order_items (
  order_id, product_id, product_name, quantity, unit_price, total_price
) SELECT 
  o.id, 'test-product', 'Test Product', 1, 100.00, 100.00
FROM orders o 
WHERE o.order_number = 'ORD-TEST-001'
ON CONFLICT DO NOTHING;

COMMIT;
