-- scripts/11-create-site-settings.sql

CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    hero_title VARCHAR(255) DEFAULT 'Premium Trading Cards & Collectibles Store',
    hero_subtitle TEXT DEFAULT 'Discover authentic Magic: The Gathering, Pokemon, Yu-Gi-Oh! cards and rare collectibles. Build legendary decks with guaranteed authentic trading card games from the most trusted TCG store.',
    hero_image_url VARCHAR(500),
    logo_url VARCHAR(500),
    favicon_url VARCHAR(500),
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one row can exist by adding a check constraint (id must be 1)
    CONSTRAINT site_settings_singleton_check CHECK (id = 1)
);

-- Insert the default row if it doesn't exist
INSERT INTO site_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
