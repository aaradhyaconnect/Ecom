-- Add auth_user_id to suppliers (links to auth.users when supplier logs in)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Allow suppliers role in profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'admin', 'staff', 'super_admin', 'supplier'));

-- Create a profile for the supplier auth user when they first verify OTP
CREATE OR REPLACE FUNCTION handle_supplier_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 'supplier')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_supplier_user_created ON auth.users;
CREATE TRIGGER on_auth_supplier_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'role' = 'supplier')
  EXECUTE FUNCTION handle_supplier_auth_user();

-- RLS policies for suppliers reading their own data
-- Suppliers can view orders assigned to them
CREATE POLICY "Suppliers view own orders" ON orders
  FOR SELECT USING (
    fulfillment_type = 'manufacturer' AND
    supplier_id IN (SELECT id FROM suppliers WHERE auth_user_id = auth.uid())
  );

-- Suppliers can view their fulfillments
CREATE POLICY "Suppliers view own fulfillments" ON order_fulfillments
  FOR SELECT USING (
    supplier_id IN (SELECT id FROM suppliers WHERE auth_user_id = auth.uid())
  );

-- Suppliers can update their fulfillments (status, tracking, notes)
CREATE POLICY "Suppliers update own fulfillments" ON order_fulfillments
  FOR UPDATE USING (
    supplier_id IN (SELECT id FROM suppliers WHERE auth_user_id = auth.uid())
  );

-- Suppliers can view fulfillment items for their fulfillments
CREATE POLICY "Suppliers view own fulfillment items" ON order_fulfillment_items
  FOR SELECT USING (
    fulfillment_id IN (
      SELECT id FROM order_fulfillments
      WHERE supplier_id IN (SELECT id FROM suppliers WHERE auth_user_id = auth.uid())
    )
  );

-- Suppliers can view their own supplier record
CREATE POLICY "Suppliers view own profile" ON suppliers
  FOR SELECT USING (
    auth_user_id = auth.uid()
  );

-- Suppliers can view products mapped to them
CREATE POLICY "Suppliers view own products" ON supplier_products
  FOR SELECT USING (
    supplier_id IN (SELECT id FROM suppliers WHERE auth_user_id = auth.uid())
  );

-- Suppliers can view their purchase orders
CREATE POLICY "Suppliers view own purchase orders" ON purchase_orders
  FOR SELECT USING (
    supplier_id IN (SELECT id FROM suppliers WHERE auth_user_id = auth.uid())
  );

-- Suppliers can view PO items for their POs
CREATE POLICY "Suppliers view own PO items" ON purchase_order_items
  FOR SELECT USING (
    po_id IN (
      SELECT id FROM purchase_orders
      WHERE supplier_id IN (SELECT id FROM suppliers WHERE auth_user_id = auth.uid())
    )
  );
