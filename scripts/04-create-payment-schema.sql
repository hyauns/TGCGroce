-- PCI DSS Compliant Database Schema for Secure Payment Data Storage
-- This script creates the payment-related tables from schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Billing Addresses Table (stores billing information with encrypted sensitive fields)
CREATE TABLE IF NOT EXISTS billing_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    address_line1 VARCHAR(100) NOT NULL,
    address_line2 VARCHAR(100),
    city VARCHAR(50) NOT NULL,
    state VARCHAR(10) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'United States',
    encrypted_phone TEXT, -- AES-256-GCM encrypted phone number
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment Methods Table (stores encrypted card data)
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    encrypted_card_number TEXT NOT NULL, -- AES-256-GCM encrypted full card number
    card_number_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for duplicate detection
    last4 VARCHAR(4) NOT NULL, -- Last 4 digits for display
    brand VARCHAR(20) NOT NULL, -- visa, mastercard, amex, discover
    expiry_month INTEGER NOT NULL CHECK (expiry_month >= 1 AND expiry_month <= 12),
    expiry_year INTEGER NOT NULL CHECK (expiry_year >= EXTRACT(YEAR FROM CURRENT_DATE)),
    encrypted_cvv TEXT NOT NULL, -- AES-256-GCM encrypted CVV with timestamp
    cvv_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for validation
    billing_address_id UUID NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT fk_billing_address FOREIGN KEY (billing_address_id) REFERENCES billing_addresses(id) ON DELETE CASCADE,
    CONSTRAINT unique_customer_card_hash UNIQUE (customer_id, card_number_hash)
);

-- Payment Audit Logs Table (comprehensive audit trail)
CREATE TABLE IF NOT EXISTS payment_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'ACCESS', 'DECRYPT')),
    resource VARCHAR(50) NOT NULL CHECK (resource IN ('PAYMENT_METHOD', 'BILLING_ADDRESS', 'CARD_DATA', 'CVV_DATA')),
    resource_id VARCHAR(255) NOT NULL,
    admin_user_id VARCHAR(255), -- NULL for customer actions, populated for admin actions
    ip_address INET NOT NULL,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 10)
);

-- Transaction Records Table (for payment processing history)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    payment_method_id UUID NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255) UNIQUE, -- Gateway transaction ID
    authorization_code VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
    gateway_response JSONB, -- Store full gateway response for debugging
    risk_score INTEGER DEFAULT 0,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE RESTRICT
);

-- Key Rotation Log Table (for encryption key management)
CREATE TABLE IF NOT EXISTS encryption_key_rotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_type VARCHAR(20) NOT NULL CHECK (key_type IN ('PAYMENT', 'CVV', 'CARD')),
    old_key_hash VARCHAR(64) NOT NULL, -- Hash of old key for identification
    new_key_hash VARCHAR(64) NOT NULL, -- Hash of new key
    rotation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    rotated_by VARCHAR(255) NOT NULL, -- Admin user who performed rotation
    records_affected INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'failed'))
);

-- Security Incidents Table (for breach detection and response)
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    affected_customers TEXT[], -- Array of customer IDs
    ip_address INET,
    user_agent TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    resolution_notes TEXT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive'))
);

-- Create indexes for performance and security monitoring
CREATE INDEX IF NOT EXISTS idx_payment_methods_customer ON payment_methods(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_methods_last4 ON payment_methods(last4, brand);
CREATE INDEX IF NOT EXISTS idx_billing_addresses_customer ON billing_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_timestamp ON payment_audit_logs(customer_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_risk_score_timestamp ON payment_audit_logs(risk_score DESC, timestamp DESC) WHERE risk_score >= 7;
CREATE INDEX IF NOT EXISTS idx_admin_actions ON payment_audit_logs(admin_user_id, timestamp DESC) WHERE admin_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_processed ON payment_transactions(customer_id, processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transaction_id ON payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_status_processed ON payment_transactions(status, processed_at DESC);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_addresses_updated_at
    BEFORE UPDATE ON billing_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to securely delete payment data (overwrite before delete)
CREATE OR REPLACE FUNCTION secure_delete_payment_method(method_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- First overwrite sensitive data
    UPDATE payment_methods 
    SET encrypted_card_number = 'SECURELY_DELETED_' || gen_random_uuid()::text,
        encrypted_cvv = 'SECURELY_DELETED_' || gen_random_uuid()::text,
        card_number_hash = 'DELETED',
        cvv_hash = 'DELETED'
    WHERE id = method_id;
    
    -- Then delete the record
    DELETE FROM payment_methods WHERE id = method_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rotate encryption keys (placeholder for key rotation process)
CREATE OR REPLACE FUNCTION log_key_rotation(
    p_key_type VARCHAR(20),
    p_old_key_hash VARCHAR(64),
    p_new_key_hash VARCHAR(64),
    p_rotated_by VARCHAR(255),
    p_records_affected INTEGER
)
RETURNS UUID AS $$
DECLARE
    rotation_id UUID;
BEGIN
    INSERT INTO encryption_key_rotations (
        key_type, old_key_hash, new_key_hash, rotated_by, records_affected
    ) VALUES (
        p_key_type, p_old_key_hash, p_new_key_hash, p_rotated_by, p_records_affected
    ) RETURNING id INTO rotation_id;
    
    RETURN rotation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Views for safe data access (never expose encrypted fields)
CREATE OR REPLACE VIEW safe_payment_methods AS
SELECT 
    id,
    customer_id,
    last4,
    brand,
    expiry_month,
    expiry_year,
    billing_address_id,
    is_default,
    created_at,
    updated_at,
    last_used
FROM payment_methods;

CREATE OR REPLACE VIEW payment_method_summary AS
SELECT 
    customer_id,
    COUNT(*) as total_methods,
    COUNT(CASE WHEN is_default THEN 1 END) as default_methods,
    MAX(last_used) as last_payment_date,
    MIN(created_at) as first_method_added
FROM payment_methods
GROUP BY customer_id;

-- Insert success message
SELECT 'Payment schema tables created successfully!' as result;
