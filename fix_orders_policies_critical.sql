-- CRITICAL FIX: Clean up problematic orders policies
-- This will resolve the "more than one row returned by a subquery" error

-- ====================================
-- 1. DROP ALL PROBLEMATIC POLICIES
-- ====================================

-- Drop all existing policies on orders (they have complex subqueries causing the error)
DROP POLICY IF EXISTS "Authenticated role 3 can view orders" ON public.orders;
DROP POLICY IF EXISTS "Delete own orders for role 1" ON public.orders;
DROP POLICY IF EXISTS "Profiles role 1 can view own orders" ON public.orders;
DROP POLICY IF EXISTS "role_1_update_own_orders" ON public.orders;
DROP POLICY IF EXISTS "role_2_update_own_orders" ON public.orders;
DROP POLICY IF EXISTS "Users with role 2 can view own orders" ON public.orders;

-- Drop any other possible policies
DROP POLICY IF EXISTS "Users can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view orders" ON public.orders;

-- Drop the new policies we created (in case they already exist)
DROP POLICY IF EXISTS "consumers_view_own_orders" ON public.orders;
DROP POLICY IF EXISTS "producers_view_their_sales" ON public.orders;
DROP POLICY IF EXISTS "admins_view_all_orders" ON public.orders;
DROP POLICY IF EXISTS "consumers_insert_orders" ON public.orders;
DROP POLICY IF EXISTS "producers_update_their_orders" ON public.orders;
DROP POLICY IF EXISTS "consumers_cancel_pending_orders" ON public.orders;

-- ====================================
-- 2. ENABLE RLS ON ORDERS
-- ====================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ====================================
-- 3. CREATE SIMPLE, WORKING POLICIES
-- ====================================

-- Policy 1: Consumers (role_id = 1) can view their own orders
CREATE POLICY "consumers_view_own_orders" ON public.orders
FOR SELECT TO authenticated
USING (
    user_id = auth.uid() 
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role_id = 1
    )
);

-- Policy 2: Producers (role_id = 3) can view orders for their products (where they are the seller)
CREATE POLICY "producers_view_their_sales" ON public.orders
FOR SELECT TO authenticated
USING (
    seller_id = auth.uid()
);

-- Policy 3: Admins (role_id = 2) can view all orders
CREATE POLICY "admins_view_all_orders" ON public.orders
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role_id = 2
    )
);

-- Policy 4: Consumers can insert their own orders
CREATE POLICY "consumers_insert_orders" ON public.orders
FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role_id = 1
    )
);

-- Policy 5: Producers can update orders where they are the seller (for status changes)
CREATE POLICY "producers_update_their_orders" ON public.orders
FOR UPDATE TO authenticated
USING (
    seller_id = auth.uid()
)
WITH CHECK (
    seller_id = auth.uid()
);

-- Policy 6: Consumers can cancel their own orders (if status is pending)
CREATE POLICY "consumers_cancel_pending_orders" ON public.orders
FOR UPDATE TO authenticated
USING (
    user_id = auth.uid() 
    AND status_id = 3 -- pending status
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role_id = 1
    )
)
WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role_id = 1
    )
);

-- ====================================
-- 4. FIX ORDER_ITEMS POLICIES
-- ====================================

-- Drop all existing policies on order_items
DROP POLICY IF EXISTS "Users can view their product order items" ON public.order_items;
DROP POLICY IF EXISTS "role_3_view_order_items" ON public.order_items;
DROP POLICY IF EXISTS "role_1_insert_order_items" ON public.order_items;
DROP POLICY IF EXISTS "Order owners can view order_items" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_policy" ON public.order_items;

-- Drop the new order_items policies we created (in case they already exist)
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create simple policies for order_items
CREATE POLICY "order_items_select" ON public.order_items
FOR SELECT TO authenticated
USING (
    -- User is the buyer of the order
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
    OR
    -- User is the seller of the order
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.seller_id = auth.uid())
);

CREATE POLICY "order_items_insert" ON public.order_items
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- ====================================
-- 5. GRANT PERMISSIONS
-- ====================================

GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO authenticated;

-- ====================================
-- 6. VERIFY POLICIES
-- ====================================

-- Check that policies are created correctly
SELECT 
    policyname, 
    cmd,
    left(qual, 50) || '...' as condition_preview
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'orders'
ORDER BY policyname;
