-- Migration 00006: Fix missing database objects and create admin user
-- Run this in Supabase SQL Editor

-- 1. Create get_product_by_slug RPC function (referenced in queries.ts)
CREATE OR REPLACE FUNCTION get_product_by_slug(p_slug TEXT)
RETURNS SETOF products
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM products WHERE slug = p_slug;
$$;

-- 2. Add sale_percent column to products (used by admin form)
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_percent INTEGER CHECK (sale_percent >= 0 AND sale_percent <= 100);

-- 3. Add video_url column to products (used by admin form)
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 4. Create admin user
-- First, create the auth user (use a secure password in production!)
-- Default password: Admin@123 (change after first login!)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@hainju.com',
  crypt('Admin@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin","role":"admin"}',
  NOW(),
  NOW(),
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- 5. Create the admin profile (linked to the auth user)
INSERT INTO profiles (id, email, name, phone, role, created_at, updated_at)
SELECT 
  id,
  'admin@hainju.com',
  'Admin',
  NULL,
  'admin',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@hainju.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 6. Verify: Run this to confirm admin user exists
-- SELECT u.email, p.name, p.role FROM auth.users u JOIN profiles p ON u.id = p.id WHERE p.role = 'admin';
