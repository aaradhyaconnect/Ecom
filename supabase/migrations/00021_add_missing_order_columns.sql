-- Migration: Add missing shiprocket and prebook columns to orders
-- These columns exist in the TypeScript types but were never created

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id BIGINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS awb_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS prebook_note TEXT;
