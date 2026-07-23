-- Migration 00012: MVP Admin Panel — SKU, categories, RBAC, stock history
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. PRODUCTS: Add SKU, barcode, SEO, status, cost_price, stock_alert
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) CHECK (cost_price >= 0);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_alert INTEGER DEFAULT 5 CHECK (stock_alert >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_idx ON products(sku) WHERE sku IS NOT NULL;

-- ============================================
-- 2. CATEGORIES table (dynamic, replaces CHECK constraint)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin can manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed default categories
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Women''s Clothing', 'women-clothing', 1),
  ('Artificial Jewellery', 'artificial-jewellery', 2),
  ('New Arrivals', 'new-arrivals', 3),
  ('Best Sellers', 'best-sellers', 4),
  ('Sale', 'sale', 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. STAFF USERS table (RBAC)
-- ============================================
CREATE TABLE IF NOT EXISTS staff_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'admin', 'staff')),
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage staff" ON staff_users FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE TRIGGER staff_users_updated_at BEFORE UPDATE ON staff_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 4. STOCK HISTORY table (audit log)
-- ============================================
CREATE TABLE IF NOT EXISTS stock_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('set', 'increase', 'decrease', 'order', 'return', 'adjustment')),
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  reason TEXT,
  order_id TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage stock history" ON stock_history FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE INDEX IF NOT EXISTS stock_history_product_id_idx ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS stock_history_created_at_idx ON stock_history(created_at DESC);

-- ============================================
-- 5. ORDER NOTES (timeline/audit)
-- ============================================
CREATE TABLE IF NOT EXISTS order_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage order notes" ON order_notes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE INDEX IF NOT EXISTS order_notes_order_id_idx ON order_notes(order_id);

-- ============================================
-- 6. STORE SETTINGS: Add marketing/popup fields
-- ============================================
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '₹';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'INR';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS promo_popup_enabled BOOLEAN DEFAULT false;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS promo_popup_title TEXT DEFAULT '';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS promo_popup_subtitle TEXT DEFAULT '';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS promo_popup_image TEXT DEFAULT '';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS promo_popup_link TEXT DEFAULT '';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS email_from_name TEXT DEFAULT 'Femme Drip';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS email_from_address TEXT DEFAULT 'hello@femmedrip.com';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS razorpay_key_id TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS razorpay_key_secret TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS cashfree_app_id TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS cashfree_secret_key TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS shiprocket_email TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS shiprocket_password TEXT;

-- ============================================
-- 7. Relax product category CHECK to allow any text
-- ============================================
-- The original CHECK constraint restricts category to 5 values.
-- We need to drop it and recreate with a more permissive check or remove it.
-- Since we now have a categories table, we allow any non-empty string.
DO $$
BEGIN
  -- Try to drop the old CHECK constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_category_check'
    AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_category_check;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add a new permissive check (non-empty string)
DO $$
BEGIN
  ALTER TABLE products ADD CONSTRAINT products_category_check
    CHECK (category ~ '^[a-z0-9-]+$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
