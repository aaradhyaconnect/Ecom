-- Add text_position column to banners table
-- Run this in your Supabase SQL editor

ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_position TEXT DEFAULT 'left' CHECK (text_position IN ('left', 'right'));
