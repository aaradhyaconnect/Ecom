-- Migration 00006: Fix missing database objects and create admin user
-- Run this in Supabase SQL Editor

-- 1. Create get_product_by_slug RPC function
CREATE OR REPLACE FUNCTION get_product_by_slug(p_slug TEXT)
RETURNS SETOF products
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM products WHERE slug = p_slug;
$$;

-- 2. Add sale_percent column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_percent INTEGER CHECK (sale_percent >= 0 AND sale_percent <= 100);

-- 3. Add video_url column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 4. Create admin user (safe: skips if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@hainju.com') THEN
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
    );
  END IF;
END $$;

-- 5. Create admin profile (safe: skips if exists, updates role if needed)
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@hainju.com';
  IF admin_id IS NOT NULL THEN
    INSERT INTO profiles (id, email, name, phone, role, created_at, updated_at)
    VALUES (admin_id, 'admin@hainju.com', 'Admin', NULL, 'admin', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;
END $$;

-- 6. Verify admin user exists
-- SELECT u.email, p.name, p.role FROM auth.users u JOIN profiles p ON u.id = p.id WHERE p.role = 'admin';
