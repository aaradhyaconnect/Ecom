-- HAINJU - Seed Data for Development
-- Run after the migration to populate sample data

-- Insert sample products
INSERT INTO products (name, slug, description, category, price, compare_price, images, sizes, colors, tags, is_new, is_best_seller, is_sale, stock, rating, review_count) VALUES
(
  'Elegance Silk Maxi Dress',
  'elegance-silk-maxi-dress',
  'A stunning floor-length silk maxi dress with a flattering A-line silhouette. Features a deep V-neckline and gathered waist for an effortlessly elegant look. Perfect for evening soirees and special occasions.',
  'women-clothing',
  3499,
  4999,
  ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600'],
  ARRAY['XS', 'S', 'M', 'L', 'XL'],
  '[{"name":"Black","hex":"#000000"},{"name":"Burgundy","hex":"#800020"},{"name":"Navy","hex":"#000080"}]',
  ARRAY['silk', 'maxi', 'evening', 'elegant'],
  true, true, false, 25, 4.5, 42
),
(
  'Linen Blend Blazer',
  'linen-blend-blazer',
  'Tailored linen blend blazer with notch lapels and a single-button closure. Lightweight and breathable, perfect for transitional weather. Features internal pockets and a relaxed fit.',
  'women-clothing',
  4299,
  5499,
  ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600', 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600'],
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  '[{"name":"Beige","hex":"#F5F5DC"},{"name":"White","hex":"#FFFFFF"},{"name":"Grey","hex":"#808080"}]',
  ARRAY['blazer', 'linen', 'formal', 'office'],
  true, false, false, 30, 4.3, 28
),
(
  'Artisan Floral Print Dress',
  'artisan-floral-print-dress',
  'Handcrafted floral print dress with a fit-and-flare silhouette. Made from premium cotton with a subtle sheen. Features smocked bodice, puff sleeves, and a hidden zipper back.',
  'women-clothing',
  2499,
  3499,
  ARRAY['https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=600', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'],
  ARRAY['XS', 'S', 'M', 'L', 'XL'],
  '[{"name":"Blue Floral","hex":"#4169E1"},{"name":"Pink Floral","hex":"#FF69B4"}]',
  ARRAY['floral', 'cotton', 'summer', 'casual'],
  false, true, false, 40, 4.7, 56
),
(
  'Cashmere Blend Cardigan',
  'cashmere-blend-cardigan',
  'Luxuriously soft cashmere blend cardigan with ribbed cuffs and hem. Open-front design with a relaxed silhouette. Perfect layering piece for cooler months.',
  'women-clothing',
  3999,
  5299,
  ARRAY['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600', 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a80?w=600'],
  ARRAY['S', 'M', 'L', 'XL'],
  '[{"name":"Camel","hex":"#C19A6B"},{"name":"Charcoal","hex":"#36454F"},{"name":"Cream","hex":"#FFFDD0"}]',
  ARRAY['cashmere', 'cardigan', 'winter', 'layering'],
  false, true, false, 15, 4.6, 35
),
(
  'Crystal Drop Earrings',
  'crystal-drop-earrings',
  'Exquisite crystal drop earrings with gold-plated settings. Each earring features a teardrop-cut cubic zirconia surrounded by pave-set crystals. Hypoallergenic and nickel-free.',
  'artificial-jewellery',
  1299,
  2499,
  ARRAY['https://images.unsplash.com/photo-1535632066927-ab7c8ab60908?w=600', 'https://images.unsplash.com/photo-1509750611-1f9e5c91e3e3?w=600'],
  ARRAY['One Size'],
  '[{"name":"Gold","hex":"#FFD700"},{"name":"Silver","hex":"#C0C0C0"}]',
  ARRAY['earrings', 'crystal', 'party', 'gold'],
  true, true, false, 50, 4.8, 89
),
(
  'Pearl Layered Necklace',
  'pearl-layered-necklace',
  'Elegant multi-strand pearl necklace with a modern twist. Features genuine freshwater pearls in varying sizes with a delicate gold-plated clasp. Adjustable length from 16-18 inches.',
  'artificial-jewellery',
  1899,
  2999,
  ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600', 'https://images.unsplash.com/photo-1491147334573-44cbb4602074?w=600'],
  ARRAY['One Size'],
  '[{"name":"White Pearl","hex":"#FFF5EE"},{"name":"Cream Pearl","hex":"#FFFDD0"}]',
  ARRAY['necklace', 'pearl', 'bridal', 'classic'],
  true, true, true, 35, 4.9, 112
),
(
  'Chandelier Statement Earrings',
  'chandelier-statement-earrings',
  'Dramatic chandelier earrings with intricate filigree work. Handcrafted with premium alloy and finished with a lustrous gold polish. Lightweight despite their grand appearance.',
  'artificial-jewellery',
  999,
  1799,
  ARRAY['https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600', 'https://images.unsplash.com/photo-1535632066927-ab7c8ab60908?w=600'],
  ARRAY['One Size'],
  '[{"name":"Gold","hex":"#FFD700"},{"name":"Rose Gold","hex":"#B76E79"}]',
  ARRAY['earrings', 'chandelier', 'statement', 'party'],
  false, false, true, 60, 4.4, 45
),
(
  'Slim Fit Trousers',
  'slim-fit-trousers',
  'Clean-cut slim fit trousers in stretch cotton twill. Features a mid-rise waist, front zip fly, and side pockets. Versatile enough for office or weekend wear.',
  'women-clothing',
  1999,
  2999,
  ARRAY['https://images.unsplash.com/photo-1594633312681-425c7b97a0e1?w=600', 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600'],
  ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  '[{"name":"Black","hex":"#000000"},{"name":"Navy","hex":"#000080"},{"name":"Grey","hex":"#808080"},{"name":"Olive","hex":"#556B2F"}]',
  ARRAY['trousers', 'formal', 'office', 'stretch'],
  false, true, false, 45, 4.2, 31
),
(
  'Embroidered Crop Top',
  'embroidered-crop-top',
  'Intricately embroidered crop top with mirror work details. Crafted from lightweight georgette with a lined bodice. Features a tie-back closure and adjustable shoulder straps.',
  'women-clothing',
  1499,
  2199,
  ARRAY['https://images.unsplash.com/photo-1503341338985-c0477be52513?w=600', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'],
  ARRAY['XS', 'S', 'M', 'L'],
  '[{"name":"White","hex":"#FFFFFF"},{"name":"Mint","hex":"#98FF98"},{"name":"Coral","hex":"#FF7F50"}]',
  ARRAY['crop', 'embroidered', 'summer', 'festival'],
  true, false, false, 55, 4.1, 22
),
(
  'Bangle Set with Kundan',
  'bangle-set-kundan',
  'Traditional kundan-style bangle set comprising 6 pieces. Each bangle features intricate meenakari work and premium stone settings. Comes in a velvet pouch.',
  'artificial-jewellery',
  799,
  1499,
  ARRAY['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600', 'https://images.unsplash.com/photo-1569163139599-0f7517e1f0b4?w=600'],
  ARRAY['One Size'],
  '[{"name":"Red & Gold","hex":"#FF0000"},{"name":"Green & Gold","hex":"#006400"},{"name":"Blue & Gold","hex":"#0000FF"}]',
  ARRAY['bangles', 'kundan', 'traditional', 'bridal'],
  false, true, false, 40, 4.5, 67
),
(
  'Designer Cocktail Ring',
  'designer-cocktail-ring',
  'Statement cocktail ring with a large oval-cut cubic zirconia stone. Surrounded by smaller pave-set stones in a vintage-inspired halo setting. Adjustable band fits most finger sizes.',
  'artificial-jewellery',
  599,
  999,
  ARRAY['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600', 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=600'],
  ARRAY['One Size'],
  '[{"name":"Gold","hex":"#FFD700"},{"name":"Silver","hex":"#C0C0C0"},{"name":"Rose Gold","hex":"#B76E79"}]',
  ARRAY['ring', 'cocktail', 'statement', 'crystal'],
  true, false, true, 70, 4.3, 38
),
(
  'Anarkali Kurta Set',
  'anarkali-kurta-set',
  'Floor-length Anarkali kurta in luxurious chiffon with heavy zari work. Paired with a matching dupatta and straight-cut salwar. Perfect for weddings and festive occasions.',
  'women-clothing',
  4999,
  7999,
  ARRAY['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600', 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=600'],
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  '[{"name":"Peach","hex":"#FFDAB9"},{"name":"Teal","hex":"#008080"},{"name":"Maroon","hex":"#800000"}]',
  ARRAY['anarkali', 'festive', 'bridal', 'chiffon'],
  true, true, false, 20, 4.7, 73
) ON CONFLICT (slug) DO NOTHING;

-- Insert sample coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_order, max_discount, usage_limit, is_active, expires_at) VALUES
('WELCOME20', '20% off for new customers', 'percentage', 20, 999, 500, 100, true, NOW() + INTERVAL '365 days'),
('HAINJU50', 'Flat ₹50 off on your first order', 'flat', 50, 499, NULL, 200, true, NOW() + INTERVAL '180 days'),
('FREESHIP', 'Free shipping on all orders', 'flat', 49, 0, 49, 500, true, NOW() + INTERVAL '365 days'),
('FESTIVE15', '15% off on festive collection', 'percentage', 15, 1499, 750, 50, true, NOW() + INTERVAL '60 days') ON CONFLICT (code) DO NOTHING;

-- Insert sample banners
INSERT INTO banners (title, subtitle, image, link, "order", is_active) VALUES
('New Collection Drop', 'Explore our latest self-designed collection', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200', '/products/new-arrivals', 1, true),
('Jewellery That Speaks', 'Handpicked artificial jewellery treasures', 'https://images.unsplash.com/photo-1515562141589-6776a3bb5f1e?w=1200', '/products/artificial-jewellery', 2, true),
('End of Season Sale', 'Up to 50% off on premium fashion', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200', '/products/sale', 3, true) ON CONFLICT DO NOTHING;
