-- Cashfree payment gateway integration
-- Run this in your Supabase SQL editor

-- Add Cashfree columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cashfree_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cashfree_payment_id TEXT;

-- Update payment_method constraint to include 'cashfree'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('cod', 'razorpay', 'cashfree'));

-- Update order_status constraint to include 'processing' and 'packed'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_status_check CHECK (order_status IN ('pending', 'confirmed', 'processing', 'packed', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned'));
