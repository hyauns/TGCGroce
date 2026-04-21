-- ============================================================
-- 13: Feed Configurations for Google Merchant Center
-- ============================================================
-- Stores filter rules for dynamic GMC XML feeds.
-- Each row produces a unique, non-guessable public URL
-- that Google Merchant Center can crawl without authentication.
-- ============================================================

CREATE TABLE IF NOT EXISTS feed_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,

    -- Filter dimensions (all nullable = "include everything")
    category_slug VARCHAR(100),              -- NULL = all categories
    product_type VARCHAR(50),                -- 'sealed', 'single', NULL = all
    stock_status VARCHAR(20) DEFAULT 'in_stock'
        CHECK (stock_status IN ('in_stock', 'out_of_stock', 'all')),
    exclude_preorders BOOLEAN DEFAULT FALSE,
    min_price DECIMAL(10,2),
    max_price DECIMAL(10,2),

    -- Lifecycle
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for public endpoint lookup by UUID (PK already indexed)
-- Index for admin listing of active feeds
CREATE INDEX IF NOT EXISTS idx_feed_configurations_active
    ON feed_configurations(is_active, created_at DESC);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_feed_configurations_updated_at ON feed_configurations;

CREATE TRIGGER update_feed_configurations_updated_at
    BEFORE UPDATE ON feed_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'feed_configurations table created successfully!' AS result;
