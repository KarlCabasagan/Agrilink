-- Fix order_items RLS policies to prevent infinite recursion
-- This script consolidates all order_items policies into simple, non-conflicting rules

-- First, drop all existing policies on order_items to start clean
DROP POLICY IF EXISTS "Users can view their product order items" ON public.order_items;
DROP POLICY IF EXISTS "role_3_view_order_items" ON public.order_items;
DROP POLICY IF EXISTS "role_1_insert_order_items" ON public.order_items;
DROP POLICY IF EXISTS "Order owners can view order_items" ON public.order_items;

-- Drop any other existing policies that might exist
DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can delete order items" ON public.order_items;
DROP POLICY IF EXISTS "Consumers can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Producers can view order items for their products" ON public.order_items;
DROP POLICY IF EXISTS "Consumers can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Producers can update order items for their products" ON public.order_items;

-- Ensure RLS is enabled
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create a single, comprehensive view policy that covers both consumers and producers
-- This avoids conflicts between multiple policies
CREATE POLICY "order_items_select_policy" ON public.order_items
FOR SELECT TO authenticated
USING (
    -- Allow if user is the order owner (consumer)
    EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_items.order_id 
        AND o.user_id = auth.uid()
    )
    OR
    -- Allow if user is the product owner (producer)
    EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = order_items.product_id 
        AND p.user_id = auth.uid()
    )
);

-- Single insert policy for order_items (only order owners can insert)
CREATE POLICY "order_items_insert_policy" ON public.order_items
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_items.order_id 
        AND o.user_id = auth.uid()
    )
);

-- Single update policy (only product owners can update - for order fulfillment)
CREATE POLICY "order_items_update_policy" ON public.order_items
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = order_items.product_id 
        AND p.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = order_items.product_id 
        AND p.user_id = auth.uid()
    )
);

-- Grant necessary permissions
GRANT SELECT ON public.order_items TO authenticated;
GRANT INSERT ON public.order_items TO authenticated;
GRANT UPDATE ON public.order_items TO authenticated;

-- Also ensure orders table has proper permissions
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
