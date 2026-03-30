-- User Management and Authentication Tables
-- Extends the existing customers table with additional user management features

-- User Sessions Table (for session management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Foreign key to existing customers table
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- User Preferences Table (for user settings and preferences)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id INTEGER NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    order_notifications BOOLEAN DEFAULT TRUE,
    wishlist_notifications BOOLEAN DEFAULT TRUE,
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    preferred_language VARCHAR(5) DEFAULT 'en-US',
    theme_preference VARCHAR(10) DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark', 'auto')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to existing customers table
    CONSTRAINT fk_customer_preferences FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Shipping Addresses Table (for customer shipping addresses)
CREATE TABLE IF NOT EXISTS shipping_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id INTEGER NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    company VARCHAR(100),
    address_line1 VARCHAR(100) NOT NULL,
    address_line2 VARCHAR(100),
    city VARCHAR(50) NOT NULL,
    state VARCHAR(10) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'United States',
    phone VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to existing customers table
    CONSTRAINT fk_customer_shipping FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Wishlist Table (for customer wishlists)
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    -- Foreign keys
    CONSTRAINT fk_customer_wishlist FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_wishlist FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate wishlist items
    CONSTRAINT unique_customer_product_wishlist UNIQUE (customer_id, product_id)
);

-- Shopping Cart Table (for persistent cart storage)
CREATE TABLE IF NOT EXISTS shopping_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id INTEGER,
    session_id VARCHAR(255),
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_customer_cart FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_cart FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    -- Either customer_id or session_id must be present
    CONSTRAINT check_customer_or_session CHECK (customer_id IS NOT NULL OR session_id IS NOT NULL),
    
    -- Unique constraint to prevent duplicate cart items
    CONSTRAINT unique_customer_product_cart UNIQUE (customer_id, product_id),
    CONSTRAINT unique_session_product_cart UNIQUE (session_id, product_id)
);

-- Product Reviews Table (for customer reviews)
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    order_id INTEGER, -- Optional: link to verified purchase
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_customer_review FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_review FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_review FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    
    -- One review per customer per product
    CONSTRAINT unique_customer_product_review UNIQUE (customer_id, product_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_customer ON user_sessions(customer_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_customer ON shipping_addresses(customer_id, is_default DESC);
CREATE INDEX IF NOT EXISTS idx_wishlists_customer ON wishlists(customer_id, added_at DESC);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_customer ON shopping_carts(customer_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_session ON shopping_carts(session_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id, is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer ON product_reviews(customer_id, created_at DESC);

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipping_addresses_updated_at
    BEFORE UPDATE ON shipping_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_carts_updated_at
    BEFORE UPDATE ON shopping_carts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
    BEFORE UPDATE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert success message
SELECT 'User management tables created successfully!' as result;
