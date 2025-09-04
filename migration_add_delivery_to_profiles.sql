-- =================================
-- MIGRATION: Move delivery settings from products to profiles table
-- =================================

-- Add delivery settings columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(10,2) DEFAULT 50.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS minimum_order_quantity DECIMAL(10,2) DEFAULT 1.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pickup_location TEXT;

-- Remove delivery settings columns from products table
ALTER TABLE public.products DROP COLUMN IF EXISTS delivery_cost;
ALTER TABLE public.products DROP COLUMN IF EXISTS minimum_order_quantity;
ALTER TABLE public.products DROP COLUMN IF EXISTS pickup_location;
