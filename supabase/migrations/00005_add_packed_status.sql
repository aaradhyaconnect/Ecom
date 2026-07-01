ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_order_status_check
  CHECK (order_status IN ('pending', 'confirmed', 'packed', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned'));
