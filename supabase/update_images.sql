-- Update product images in live database with real Unsplash URLs
-- Run this in Supabase SQL Editor

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
  'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600'
] WHERE slug = 'elegance-silk-maxi-dress';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600',
  'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600'
] WHERE slug = 'linen-blend-blazer';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=600',
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'
] WHERE slug = 'artisan-floral-print-dress';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600',
  'https://images.unsplash.com/photo-1434389677669-e08b4cda3a80?w=600'
] WHERE slug = 'cashmere-blend-cardigan';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1535632066927-ab7c8ab60908?w=600',
  'https://images.unsplash.com/photo-1509750611-1f9e5c91e3e3?w=600'
] WHERE slug = 'crystal-drop-earrings';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600',
  'https://images.unsplash.com/photo-1491147334573-44cbb4602074?w=600'
] WHERE slug = 'pearl-layered-necklace';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600',
  'https://images.unsplash.com/photo-1535632066927-ab7c8ab60908?w=600'
] WHERE slug = 'chandelier-statement-earrings';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1594633312681-425c7b97a0e1?w=600',
  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600'
] WHERE slug = 'slim-fit-trousers';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1503341338985-c0477be52513?w=600',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'
] WHERE slug = 'embroidered-crop-top';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600',
  'https://images.unsplash.com/photo-1569163139599-0f7517e1f0b4?w=600'
] WHERE slug = 'bangle-set-kundan';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600',
  'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=600'
] WHERE slug = 'designer-cocktail-ring';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
  'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=600'
] WHERE slug = 'anarkali-kurta-set';
