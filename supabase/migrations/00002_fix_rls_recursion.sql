-- Fix infinite recursion in RLS policies
-- The root cause: policies that query profiles table trigger RLS on profiles,
-- which has a self-referencing admin policy -> infinite recursion

-- 1. Create security definer function to check admin role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 2. Drop all policies that reference profiles directly
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can manage products" ON products;
DROP POLICY IF EXISTS "Admin can view all orders" ON orders;
DROP POLICY IF EXISTS "Admin can update orders" ON orders;
DROP POLICY IF EXISTS "Admin can manage banners" ON banners;
DROP POLICY IF EXISTS "Admin can manage coupons" ON coupons;
DROP POLICY IF EXISTS "Admin can view subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admin can view messages" ON contact_messages;

-- 3. Re-create policies using is_admin() function

-- Profiles: users can read/update own profile, admin can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can view all profiles" ON profiles FOR SELECT USING (public.is_admin());

-- Products: public read, admin write
CREATE POLICY "Products are publicly readable" ON products FOR SELECT USING (true);
CREATE POLICY "Admin can manage products" ON products FOR ALL USING (public.is_admin());

-- Orders: users can view own, admin can view all
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all orders" ON orders FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin can update orders" ON orders FOR UPDATE USING (public.is_admin());

-- Banners: public read, admin write
CREATE POLICY "Banners are publicly readable" ON banners FOR SELECT USING (true);
CREATE POLICY "Admin can manage banners" ON banners FOR ALL USING (public.is_admin());

-- Coupons: admin only
CREATE POLICY "Admin can manage coupons" ON coupons FOR ALL USING (public.is_admin());

-- Newsletter: anyone can insert
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view subscribers" ON newsletter_subscribers FOR SELECT USING (public.is_admin());

-- Contact: anyone can insert
CREATE POLICY "Anyone can contact" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view messages" ON contact_messages FOR SELECT USING (public.is_admin());
