-- Migration 00007: Add admin features (reviews moderation, store settings)
-- Run this in Supabase SQL Editor

-- 1. Add is_approved column to reviews (for moderation)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- 2. Create store_settings table
CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  store_name TEXT DEFAULT 'HAINJU',
  store_description TEXT DEFAULT 'Premium Designer Clothing & Jewellery',
  contact_email TEXT DEFAULT 'hello@hainju.com',
  contact_phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  currency TEXT DEFAULT 'INR',
  tax_rate DECIMAL(5,2) DEFAULT 0,
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  free_shipping_min DECIMAL(10,2) DEFAULT 0,
  social_instagram TEXT DEFAULT '',
  social_facebook TEXT DEFAULT '',
  social_twitter TEXT DEFAULT '',
  social_youtube TEXT DEFAULT '',
  seo_title TEXT DEFAULT 'HAINJU - Premium Designer Clothing & Jewellery',
  seo_description TEXT DEFAULT 'Shop premium designer clothing and artificial jewellery at HAINJU.',
  seo_keywords TEXT DEFAULT 'fashion, clothing, jewellery, designer, women',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on store_settings
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- 4. Admins can read/write store_settings
CREATE POLICY "Admins can manage store settings" ON store_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 5. Anyone can read store settings (for frontend)
CREATE POLICY "Public can read store settings" ON store_settings
  FOR SELECT USING (true);

-- 6. Add RLS policy for admins to manage contact_messages
DROP POLICY IF EXISTS "Admins can manage contact messages" ON contact_messages;
CREATE POLICY "Admins can manage contact messages" ON contact_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 7. Add RLS policy for admins to manage newsletter subscribers
DROP POLICY IF EXISTS "Admins can manage subscribers" ON newsletter_subscribers;
CREATE POLICY "Admins can manage subscribers" ON newsletter_subscribers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 8. Add RLS policy for admins to manage reviews
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
CREATE POLICY "Admins can manage reviews" ON reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
