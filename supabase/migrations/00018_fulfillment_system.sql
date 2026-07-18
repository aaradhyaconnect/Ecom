-- Migration: Hybrid Fulfillment System
-- Adds fulfillment_type, supplier tracking, and manufacturer workflow

-- 1. Add fulfillment columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'warehouse'
  CHECK (fulfillment_type IN ('warehouse', 'manufacturer'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'pending'
  CHECK (fulfillment_status IN (
    'pending', 'supplier_notified', 'supplier_accepted', 'supplier_rejected',
    'supplier_packing', 'ready_for_pickup', 'picked_up'
  ));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS supplier_notified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS supplier_accepted_at TIMESTAMPTZ;

-- 2. Supplier fulfillment tracking
CREATE TABLE IF NOT EXISTS order_fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  status TEXT DEFAULT 'assigned'
    CHECK (status IN (
      'assigned', 'notified', 'accepted', 'rejected',
      'packing', 'ready_for_pickup', 'picked_up'
    )),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  packing_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  tracking_id TEXT,
  courier_name TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_fulfillments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access fulfillments" ON order_fulfillments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);

-- 3. Per-fulfillment line items (for split shipments)
CREATE TABLE IF NOT EXISTS order_fulfillment_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fulfillment_id UUID REFERENCES order_fulfillments(id) ON DELETE CASCADE,
  order_item_index INTEGER NOT NULL,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_fulfillment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access fulfillment_items" ON order_fulfillment_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_type ON orders(fulfillment_type);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_id ON orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_order_fulfillments_order_id ON order_fulfillments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_fulfillments_supplier_id ON order_fulfillments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_order_fulfillments_status ON order_fulfillments(status);
