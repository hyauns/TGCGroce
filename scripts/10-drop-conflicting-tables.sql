-- Drop conflicting orders table if it exists with wrong schema
-- This ensures the correct orders table schema can be created

DO $$ 
BEGIN
    -- Check if orders table exists with INTEGER customer_id (wrong schema)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_id' 
        AND data_type = 'integer'
    ) THEN
        -- Drop the table with wrong schema
        DROP TABLE IF EXISTS order_items CASCADE;
        DROP TABLE IF EXISTS orders CASCADE;
        RAISE NOTICE 'Dropped conflicting orders tables with INTEGER customer_id';
    END IF;
END $$;
