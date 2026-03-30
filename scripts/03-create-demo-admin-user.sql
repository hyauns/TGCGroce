-- Create demo admin user in the database
-- This script adds a demo admin user to the users table for testing

INSERT INTO neon_auth.users_sync (
  id,
  email,
  name,
  raw_json,
  created_at,
  updated_at
) VALUES (
  'demo-admin-456',
  'admin@tcgstore.com',
  'Admin Demo',
  '{"role": "admin", "firstName": "Admin", "lastName": "Demo", "phone": "(555) 999-0000"}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  raw_json = EXCLUDED.raw_json,
  updated_at = NOW();
