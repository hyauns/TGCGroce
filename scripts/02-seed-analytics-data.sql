-- Seed data for analytics testing
-- This script populates the tables with realistic TCG store data

-- Insert sample products
INSERT INTO products (name, category, price, original_price, cost, stock_quantity) VALUES
('Magic: The Gathering - Dominaria United Booster Box', 'Magic: The Gathering', 144.99, 159.99, 120.00, 50),
('Pokemon - Scarlet & Violet Base Set Booster Box', 'Pokemon', 134.99, 149.99, 110.00, 75),
('Yu-Gi-Oh! - Power of the Elements Booster Box', 'Yu-Gi-Oh!', 89.99, 99.99, 75.00, 30),
('Disney Lorcana - The First Chapter Booster Box', 'Disney Lorcana', 143.99, 159.99, 115.00, 25),
('One Piece Card Game - Romance Dawn Booster Box', 'One Piece Card Game', 119.99, 129.99, 95.00, 40),
('Flesh and Blood - Outsiders Booster Box', 'Flesh and Blood', 99.99, 109.99, 80.00, 20),
('Magic: The Gathering - Commander Deck', 'Magic: The Gathering', 39.99, 44.99, 32.00, 100),
('Pokemon - Elite Trainer Box', 'Pokemon', 49.99, 54.99, 40.00, 80),
('Yu-Gi-Oh! - Structure Deck', 'Yu-Gi-Oh!', 12.99, 14.99, 10.00, 150),
('Disney Lorcana - Starter Deck', 'Disney Lorcana', 16.99, 19.99, 13.00, 60);

-- Insert sample customers
INSERT INTO customers (email, first_name, last_name, registration_date, total_orders, total_spent) VALUES
('john.doe@email.com', 'John', 'Doe', '2024-01-15', 5, 487.45),
('sarah.smith@email.com', 'Sarah', 'Smith', '2024-02-03', 8, 892.30),
('mike.johnson@email.com', 'Mike', 'Johnson', '2024-02-20', 3, 234.97),
('emily.davis@email.com', 'Emily', 'Davis', '2024-03-10', 12, 1456.78),
('alex.wilson@email.com', 'Alex', 'Wilson', '2024-03-25', 2, 189.98),
('lisa.brown@email.com', 'Lisa', 'Brown', '2024-04-05', 7, 678.45),
('david.miller@email.com', 'David', 'Miller', '2024-04-18', 4, 345.67),
('jessica.garcia@email.com', 'Jessica', 'Garcia', '2024-05-02', 9, 1023.89),
('ryan.martinez@email.com', 'Ryan', 'Martinez', '2024-05-15', 6, 567.23),
('amanda.taylor@email.com', 'Amanda', 'Taylor', '2024-06-01', 11, 1234.56);

-- Insert sample orders (last 6 months)
INSERT INTO orders (customer_id, order_number, status, subtotal, tax_amount, shipping_amount, total_amount, payment_status, order_date) VALUES
(1, 'ORD-2024-001', 'completed', 144.99, 11.60, 9.99, 166.58, 'paid', '2024-07-15 10:30:00'),
(2, 'ORD-2024-002', 'completed', 134.99, 10.80, 9.99, 155.78, 'paid', '2024-07-16 14:22:00'),
(3, 'ORD-2024-003', 'completed', 89.99, 7.20, 9.99, 107.18, 'paid', '2024-07-18 09:15:00'),
(4, 'ORD-2024-004', 'completed', 143.99, 11.52, 9.99, 165.50, 'paid', '2024-07-20 16:45:00'),
(5, 'ORD-2024-005', 'completed', 119.99, 9.60, 9.99, 139.58, 'paid', '2024-07-22 11:30:00'),
(1, 'ORD-2024-006', 'completed', 39.99, 3.20, 9.99, 53.18, 'paid', '2024-08-01 13:20:00'),
(2, 'ORD-2024-007', 'completed', 49.99, 4.00, 9.99, 63.98, 'paid', '2024-08-03 15:10:00'),
(6, 'ORD-2024-008', 'completed', 12.99, 1.04, 9.99, 24.02, 'paid', '2024-08-05 10:45:00'),
(7, 'ORD-2024-009', 'completed', 16.99, 1.36, 9.99, 28.34, 'paid', '2024-08-08 12:30:00'),
(8, 'ORD-2024-010', 'completed', 144.99, 11.60, 9.99, 166.58, 'paid', '2024-08-10 14:15:00'),
(9, 'ORD-2024-011', 'completed', 134.99, 10.80, 9.99, 155.78, 'paid', '2024-08-12 16:20:00'),
(10, 'ORD-2024-012', 'completed', 89.99, 7.20, 9.99, 107.18, 'paid', '2024-08-15 09:30:00'),
(2, 'ORD-2024-013', 'completed', 143.99, 11.52, 9.99, 165.50, 'paid', '2024-09-01 11:45:00'),
(4, 'ORD-2024-014', 'completed', 119.99, 9.60, 9.99, 139.58, 'paid', '2024-09-03 13:25:00'),
(6, 'ORD-2024-015', 'completed', 39.99, 3.20, 9.99, 53.18, 'paid', '2024-09-05 15:40:00'),
(8, 'ORD-2024-016', 'completed', 49.99, 4.00, 9.99, 63.98, 'paid', '2024-09-08 10:20:00'),
(1, 'ORD-2024-017', 'completed', 12.99, 1.04, 9.99, 24.02, 'paid', '2024-09-10 12:15:00'),
(3, 'ORD-2024-018', 'completed', 16.99, 1.36, 9.99, 28.34, 'paid', '2024-09-12 14:30:00'),
(5, 'ORD-2024-019', 'completed', 144.99, 11.60, 9.99, 166.58, 'paid', '2024-09-15 16:45:00'),
(7, 'ORD-2024-020', 'completed', 134.99, 10.80, 9.99, 155.78, 'paid', '2024-09-18 09:10:00');

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
(1, 1, 1, 144.99, 144.99),
(2, 2, 1, 134.99, 134.99),
(3, 3, 1, 89.99, 89.99),
(4, 4, 1, 143.99, 143.99),
(5, 5, 1, 119.99, 119.99),
(6, 7, 1, 39.99, 39.99),
(7, 8, 1, 49.99, 49.99),
(8, 9, 1, 12.99, 12.99),
(9, 10, 1, 16.99, 16.99),
(10, 1, 1, 144.99, 144.99),
(11, 2, 1, 134.99, 134.99),
(12, 3, 1, 89.99, 89.99),
(13, 4, 1, 143.99, 143.99),
(14, 5, 1, 119.99, 119.99),
(15, 7, 1, 39.99, 39.99),
(16, 8, 1, 49.99, 49.99),
(17, 9, 1, 12.99, 12.99),
(18, 10, 1, 16.99, 16.99),
(19, 1, 1, 144.99, 144.99),
(20, 2, 1, 134.99, 134.99);

-- Insert website analytics data for conversion funnel
INSERT INTO website_analytics (session_id, event_type, page_url, product_id, customer_id, event_date) VALUES
-- Session 1: Complete conversion
('sess_001', 'page_view', '/products', NULL, 1, '2024-09-20 10:00:00'),
('sess_001', 'page_view', '/products/1', 1, 1, '2024-09-20 10:02:00'),
('sess_001', 'add_to_cart', '/products/1', 1, 1, '2024-09-20 10:05:00'),
('sess_001', 'checkout_start', '/checkout', NULL, 1, '2024-09-20 10:08:00'),
('sess_001', 'purchase', '/checkout/success', NULL, 1, '2024-09-20 10:12:00'),

-- Session 2: Abandoned at checkout
('sess_002', 'page_view', '/products', NULL, 2, '2024-09-20 11:00:00'),
('sess_002', 'page_view', '/products/2', 2, 2, '2024-09-20 11:03:00'),
('sess_002', 'add_to_cart', '/products/2', 2, 2, '2024-09-20 11:06:00'),
('sess_002', 'checkout_start', '/checkout', NULL, 2, '2024-09-20 11:10:00'),

-- Session 3: Abandoned at cart
('sess_003', 'page_view', '/products', NULL, 3, '2024-09-20 12:00:00'),
('sess_003', 'page_view', '/products/3', 3, 3, '2024-09-20 12:05:00'),
('sess_003', 'add_to_cart', '/products/3', 3, 3, '2024-09-20 12:08:00'),

-- Session 4: Just browsing
('sess_004', 'page_view', '/products', NULL, 4, '2024-09-20 13:00:00'),
('sess_004', 'page_view', '/products/4', 4, 4, '2024-09-20 13:03:00'),

-- More sessions for better analytics
('sess_005', 'page_view', '/products', NULL, 5, '2024-09-20 14:00:00'),
('sess_005', 'page_view', '/products/5', 5, 5, '2024-09-20 14:02:00'),
('sess_005', 'add_to_cart', '/products/5', 5, 5, '2024-09-20 14:05:00'),
('sess_005', 'checkout_start', '/checkout', NULL, 5, '2024-09-20 14:08:00'),
('sess_005', 'purchase', '/checkout/success', NULL, 5, '2024-09-20 14:15:00');
