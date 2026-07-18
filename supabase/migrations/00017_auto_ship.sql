-- Migration: Auto-ship + shipping label support
-- Adds shipping_label_url to orders, auto_ship_enabled to store_settings

-- 1. Add shipping_label_url column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;

-- 2. Add auto-ship toggle to store_settings
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS auto_ship_enabled BOOLEAN DEFAULT false;
