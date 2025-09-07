-- TEMPORARY: Disable RLS on order_items to test if this fixes the infinite recursion
-- WARNING: This removes all security policies temporarily - use only for testing

-- Disable RLS on order_items table
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Note: This removes all access restrictions on order_items
-- Use the fix_order_items_policies.sql script for the proper security-aware solution
