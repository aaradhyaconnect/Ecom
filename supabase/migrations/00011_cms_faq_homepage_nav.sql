-- Migration 00011: CMS, FAQ, Homepage Sections, Navigation, Customer Management

-- 1. CMS Pages (about, terms, privacy, shipping, returns, size-guide)
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published pages" ON pages FOR SELECT USING (is_published = true);
CREATE POLICY "Admin full access pages" ON pages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Seed default pages
INSERT INTO pages (slug, title, content, meta_title, meta_description) VALUES
('about', 'About Us', '<h2>Our Story</h2><p>G2I Style was born from a passion for blending traditional Indian craftsmanship with contemporary fashion. We believe every piece of clothing and jewellery should tell a story — of heritage, artistry, and personal expression.</p><h2>Our Mission</h2><p>To make premium, self-designed fashion accessible to every trendsetter who values quality and uniqueness. We work directly with skilled artisans across India to bring you collections that are both timeless and modern.</p><h2>Why Choose Us</h2><ul><li>Handpicked, premium quality fabrics and materials</li><li>Exclusive designs you won''t find anywhere else</li><li>100% authentic artificial jewellery</li><li>Secure checkout and fast delivery</li><li>Easy returns and exchanges</li></ul>', 'About Us - G2I Style', 'Learn about G2I Style - premium self-designed clothing and artificial jewellery from India.'),
('terms', 'Terms of Service', '<h2>1. Acceptance of Terms</h2><p>By accessing and using the G2I Style website, you agree to be bound by these Terms of Service.</p><h2>2. Products and Pricing</h2><p>All products are subject to availability. We reserve the right to modify prices without prior notice.</p><h2>3. Orders and Payment</h2><p>Orders are subject to acceptance and availability. We accept COD, UPI, and online payments via Cashfree.</p><h2>4. Shipping and Delivery</h2><p>We ship across India. Delivery times may vary based on location and product availability.</p><h2>5. Returns and Exchanges</h2><p>Returns are accepted within 7 days of delivery for unworn items with tags attached.</p><h2>6. Privacy</h2><p>Your personal information is handled in accordance with our Privacy Policy.</p><h2>7. Intellectual Property</h2><p>All content on this website is the property of G2I Style and protected by copyright laws.</p><h2>8. Limitation of Liability</h2><p>G2I Style shall not be liable for any indirect, incidental, or consequential damages.</p><h2>9. Changes to Terms</h2><p>We reserve the right to update these terms at any time. Continued use constitutes acceptance.</p>', 'Terms of Service - G2I Style', 'Read the terms of service for using the G2I Style website.'),
('privacy', 'Privacy Policy', '<h2>Information We Collect</h2><p>We collect information you provide directly, including name, email, phone number, and shipping address.</p><h2>How We Use Your Information</h2><p>We use your information to process orders, communicate with you, and improve our services.</p><h2>Information Sharing</h2><p>We do not sell your personal information. We share data only with service providers necessary for order fulfillment.</p><h2>Data Security</h2><p>We implement industry-standard security measures to protect your personal information.</p><h2>Cookies</h2><p>We use cookies to enhance your browsing experience and analyze site traffic.</p><h2>Your Rights</h2><p>You can access, update, or delete your personal information by contacting us.</p><h2>Contact Us</h2><p>For privacy-related inquiries, contact us at hello@g2istyle.com.</p>', 'Privacy Policy - G2I Style', 'Read the privacy policy for G2I Style.'),
('shipping', 'Shipping & Delivery', '<h2>Shipping Rates</h2><table><thead><tr><th>Order Value</th><th>Shipping Fee</th></tr></thead><tbody><tr><td>Below ₹999</td><td>₹49</td></tr><tr><td>₹999 and above</td><td>FREE</td></tr></tbody></table><h2>Delivery Timeline</h2><p>Standard delivery takes 3-7 business days depending on your location. Metro cities typically receive orders within 3-4 days.</p><h2>Shipping Partners</h2><p>We ship via trusted partners including Shiprocket, Delhivery, and BlueDart for reliable delivery across India.</p><h2>Order Tracking</h2><p>Once your order is shipped, you will receive a tracking ID via email and SMS to track your package.</p>', 'Shipping & Delivery - G2I Style', 'Learn about shipping rates and delivery timelines at G2I Style.'),
('returns', 'Returns & Exchanges', '<h2>Return Policy</h2><p>We accept returns within 7 days of delivery for most items. Items must be unworn, unwashed, and have original tags attached.</p><h2>How to Initiate a Return</h2><ol><li>Log into your account and go to My Orders</li><li>Select the order containing the item you want to return</li><li>Click "Request Return" and follow the instructions</li><li>Pack the item securely and ship it back to us</li></ol><h2>Refund Processing</h2><p>Refunds are processed within 5-7 business days after we receive the returned item. The refund will be credited to your original payment method.</p><h2>Non-Returnable Items</h2><p>Jewellery, sale items, and customized products cannot be returned unless defective.</p><h2>Exchanges</h2><p>For size exchanges, please place a new order and return the original item for a refund.</p>', 'Returns & Exchanges - G2I Style', 'Learn about the return and exchange policy at G2I Style.'),
('size-guide', 'Size Guide', '<h2>Women''s Clothing</h2><table><thead><tr><th>Size</th><th>Bust (in)</th><th>Waist (in)</th><th>Hips (in)</th></tr></thead><tbody><tr><td>XS</td><td>32</td><td>26</td><td>36</td></tr><tr><td>S</td><td>34</td><td>28</td><td>38</td></tr><tr><td>M</td><td>36</td><td>30</td><td>40</td></tr><tr><td>L</td><td>38</td><td>32</td><td>42</td></tr><tr><td>XL</td><td>40</td><td>34</td><td>44</td></tr><tr><td>XXL</td><td>42</td><td>36</td><td>46</td></tr><tr><td>3XL</td><td>44</td><td>38</td><td>48</td></tr></tbody></table><h2>How to Measure</h2><p><strong>Bust:</strong> Measure around the fullest part of your chest.</p><p><strong>Waist:</strong> Measure around your natural waistline.</p><p><strong>Hips:</strong> Measure around the fullest part of your hips.</p><h2>Between Sizes?</h2><p>If you''re between sizes, we recommend sizing up for a more comfortable fit.</p>', 'Size Guide - G2I Style', 'Find the perfect fit with the G2I Style size guide.')
ON CONFLICT (slug) DO NOTHING;

-- 2. FAQ Items
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active faq" ON faq_items FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access faq" ON faq_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Seed default FAQs
INSERT INTO faq_items (question, answer, category, sort_order) VALUES
('What payment methods do you accept?', 'We accept Cash on Delivery (COD), UPI payments (Google Pay, PhonePe, BHIM, Paytm), and online payments via Card, Net Banking, and Wallets through our secure payment partner Cashfree.', 'payment', 1),
('How long does delivery take?', 'Standard delivery takes 3-7 business days depending on your location. Metro cities typically receive orders within 3-4 days. You will receive a tracking ID once your order is shipped.', 'shipping', 2),
('What is your return policy?', 'We accept returns within 7 days of delivery for most items. Items must be unworn, unwashed, and have original tags attached. Jewelry, sale items, and customized products cannot be returned unless defective.', 'returns', 3),
('How do I track my order?', 'Once your order is shipped, you will receive a tracking ID via email and SMS. You can also track your order by logging into your account and visiting the My Orders section.', 'shipping', 4),
('Is free shipping available?', 'Yes! We offer free shipping on all orders above ₹999. For orders below ₹999, a flat shipping fee of ₹49 applies.', 'shipping', 5),
('Can I cancel my order?', 'You can cancel your order if it is still in "pending" or "confirmed" status. Go to My Orders, select the order, and click the Cancel button. Once shipped, orders cannot be cancelled.', 'orders', 6),
('Are the jewellery items tarnish-free?', 'Our artificial jewellery is designed for lasting beauty. While not completely tarnish-free, proper care (storing in a dry place, avoiding water and perfume contact) will keep them looking new for longer.', 'products', 7),
('How do I know my size?', 'Please refer to our Size Guide page for detailed measurements. Each product page also includes specific size information. If you''re between sizes, we recommend sizing up for a comfortable fit.', 'products', 8);

-- 3. Homepage Sections
CREATE TABLE IF NOT EXISTS homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  image TEXT,
  link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  config JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active sections" ON homepage_sections FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access sections" ON homepage_sections FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Seed default sections
INSERT INTO homepage_sections (section_key, title, subtitle, description, is_active, sort_order, config) VALUES
('hero', 'Hero Banner', 'Welcome to G2I Style', 'Premium self-designed clothing and exquisite artificial jewellery', true, 0, '{"slides": []}'),
('features', 'Features', NULL, NULL, true, 1, '{"items": [{"icon": "Truck", "title": "Free Shipping", "description": "On orders above ₹999"}, {"icon": "Shield", "title": "Secure Checkout", "description": "100% secure payments"}, {"icon": "RefreshCw", "title": "Easy Returns", "description": "7-day return policy"}, {"icon": "Headphones", "title": "24/7 Support", "description": "We are here to help"}]}'),
('categories', 'Shop by Category', 'Explore Our Collections', NULL, true, 2, '{}'),
('featured', 'Featured Products', 'Trending Now', 'Handpicked styles just for you', true, 3, '{"limit": 8, "sort": "popular"}'),
('editorial', 'Editorial Collection', 'Curated for You', NULL, true, 4, '{}'),
('sale', 'Sale Banner', 'Up to 50% Off', 'Limited time offer on selected styles', true, 5, '{"discount": "50%"}'),
('reviews', 'Customer Reviews', 'What Our Customers Say', NULL, true, 6, '{"limit": 6}'),
('newsletter', 'Newsletter', 'Join the G2I Style Circle', 'Subscribe for exclusive access to new drops and member-only offers', true, 7, '{}');

-- 4. Navigation Links
CREATE TABLE IF NOT EXISTS navigation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('header', 'footer_shop', 'footer_customer', 'footer_help', 'footer_company')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE navigation_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active nav links" ON navigation_links FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access nav links" ON navigation_links FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Seed default navigation links
INSERT INTO navigation_links (label, href, position, sort_order) VALUES
-- Header
('New In', '/products/new-arrivals', 'header', 0),
('Women', '/products/women-clothing', 'header', 1),
('Jewellery', '/products/artificial-jewellery', 'header', 2),
('Best Sellers', '/products/best-sellers', 'header', 3),
('Sale', '/products/sale', 'header', 4),
-- Footer Shop
('New Arrivals', '/products/new-arrivals', 'footer_shop', 0),
('Best Sellers', '/products/best-sellers', 'footer_shop', 1),
('Women', '/products/women-clothing', 'footer_shop', 2),
('Jewellery', '/products/artificial-jewellery', 'footer_shop', 3),
('Sale', '/products/sale', 'footer_shop', 4),
-- Footer Customer Service
('Contact Us', '/contact', 'footer_customer', 0),
('FAQ', '/faq', 'footer_customer', 1),
('Size Guide', '/size-guide', 'footer_customer', 2),
('Track Order', '/account/orders', 'footer_customer', 3),
-- Footer Help
('Shipping & Delivery', '/shipping', 'footer_help', 0),
('Returns & Exchanges', '/returns', 'footer_help', 1),
('Privacy Policy', '/privacy', 'footer_help', 2),
('Terms of Service', '/terms', 'footer_help', 3),
-- Footer Company
('About Us', '/about', 'footer_company', 0),
('Careers', '/careers', 'footer_company', 1);

-- 5. Add is_banned and notes to profiles (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_banned') THEN
    ALTER TABLE profiles ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notes') THEN
    ALTER TABLE profiles ADD COLUMN notes TEXT;
  END IF;
END $$;
