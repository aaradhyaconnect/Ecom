-- Pre-Book feature: allow customers to reserve special/hand-design items
-- by paying a deposit upfront, with balance collected on delivery.

-- ============================================================
-- 1. Products table — add pre-book columns
-- ============================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_prebook BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS prebook_amount DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS prebook_note TEXT;

-- Index for filtering pre-book products
CREATE INDEX IF NOT EXISTS products_is_prebook_idx ON products (is_prebook) WHERE is_prebook = true;

-- ============================================================
-- 2. Orders table — add pre-book columns
-- ============================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_prebook BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS prebook_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS prebook_status TEXT DEFAULT 'confirmed'
  CHECK (prebook_status IN ('confirmed', 'ready_to_ship', 'shipped', 'delivered', 'balance_collected'));

-- Index for filtering pre-book orders
CREATE INDEX IF NOT EXISTS orders_is_prebook_idx ON orders (is_prebook) WHERE is_prebook = true;
