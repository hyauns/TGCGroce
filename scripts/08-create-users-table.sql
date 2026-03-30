-- Create the missing users table for authentication
-- This table will serve as the primary authentication table

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes separately after table creation to fix syntax error
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_token ON users(email_verification_token);
CREATE INDEX idx_users_reset_token ON users(password_reset_token);
CREATE INDEX idx_users_status ON users(status, created_at DESC);

-- Add customer_user_id column to link customers to users
ALTER TABLE customers 
ADD COLUMN user_id UUID,
ADD CONSTRAINT fk_customers_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;

-- Create index for the new foreign key
CREATE INDEX idx_customers_user_id ON customers(user_id);

-- Update existing payment and order tables to use user_id
-- Add user_id columns while keeping customer_id for backward compatibility
ALTER TABLE payment_methods 
ADD COLUMN user_id UUID,
ADD CONSTRAINT fk_payment_methods_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE payment_audit_logs 
ADD COLUMN user_id UUID,
ADD CONSTRAINT fk_payment_audit_logs_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;

ALTER TABLE payment_transactions 
ADD COLUMN user_id UUID,
ADD CONSTRAINT fk_payment_transactions_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;

-- Update user_sessions table to use user_id instead of customer_id
ALTER TABLE user_sessions 
ADD COLUMN user_id UUID,
ADD CONSTRAINT fk_user_sessions_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Update user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN user_id UUID,
ADD CONSTRAINT fk_user_preferences_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Update shopping_carts table
ALTER TABLE shopping_carts 
ADD COLUMN user_id UUID,
ADD CONSTRAINT fk_shopping_carts_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Update wishlists table
ALTER TABLE wishlists 
ADD COLUMN user_id UUID,
ADD CONSTRAINT fk_wishlists_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Create indexes for new foreign keys
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_audit_logs_user_id ON payment_audit_logs(user_id);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_shopping_carts_user_id ON shopping_carts(user_id);
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own data (using session variables instead of roles)
CREATE POLICY users_own_data_policy ON users
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Admin policy for full access (using session variables)
CREATE POLICY admin_users_access_policy ON users
    FOR ALL
    USING (current_setting('app.user_role', true) = 'admin');

-- Permissions will be handled through application-level security

-- Create demo admin user for testing
INSERT INTO users (
    user_id,
    email,
    password_hash,
    first_name,
    last_name,
    email_verified,
    role,
    status
) VALUES (
    gen_random_uuid(),
    'admin@tcgstore.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSforHgK', -- 'admin123'
    'Admin',
    'User',
    true,
    'admin',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Create demo regular user for testing
INSERT INTO users (
    user_id,
    email,
    password_hash,
    first_name,
    last_name,
    email_verified,
    role,
    status
) VALUES (
    gen_random_uuid(),
    'demo@tcgstore.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSforHgK', -- 'demo123'
    'Demo',
    'User',
    true,
    'user',
    'active'
) ON CONFLICT (email) DO NOTHING;
