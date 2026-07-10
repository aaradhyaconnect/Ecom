-- Add UPI payment method support
-- Run this in your Supabase SQL editor

-- Update payment_method constraint to include 'upi'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('cod', 'razorpay', 'cashfree', 'upi'));
