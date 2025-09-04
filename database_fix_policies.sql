-- =================================
-- FIX RECURSIVE POLICIES SCRIPT
-- =================================
-- Run this script to fix the infinite recursion issue in RLS policies

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Farmers can manage own products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Farmers can view orders for their products" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view order items for accessible orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create admin messages" ON public.admin_messages;
DROP POLICY IF EXISTS "Users can view own admin messages" ON public.admin_messages;
DROP POLICY IF EXISTS "Admins can manage all admin messages" ON public.admin_messages;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

-- Create non-recursive policies
-- Profiles policies (no admin check to avoid recursion)
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Products policies (no admin check for now)
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (status = 'active');

CREATE POLICY "Farmers can manage own products" ON public.products
    FOR ALL USING (farmer_id = auth.uid());

-- Cart items policies
CREATE POLICY "Users can manage own cart" ON public.cart_items
    FOR ALL USING (user_id = auth.uid());

-- Favorites policies
CREATE POLICY "Users can manage own favorites" ON public.favorites
    FOR ALL USING (user_id = auth.uid());

-- Orders policies (no admin check for now)
CREATE POLICY "Customers can view own orders" ON public.orders
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Farmers can view orders for their products" ON public.orders
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.order_items oi
        JOIN public.products p ON oi.product_id = p.id
        WHERE oi.order_id = public.orders.id AND p.farmer_id = auth.uid()
    ));

-- Order items policies (no admin check for now)
CREATE POLICY "Users can view order items for accessible orders" ON public.order_items
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id AND (
            o.customer_id = auth.uid() OR
            farmer_id = auth.uid()
        )
    ));

-- Messages policies
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR ALL USING (customer_id = auth.uid() OR farmer_id = auth.uid());

CREATE POLICY "Users can view own messages" ON public.messages
    FOR ALL USING (sender_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id AND (c.customer_id = auth.uid() OR c.farmer_id = auth.uid())
    ));

-- Admin messages policies (no admin check for now)
CREATE POLICY "Users can create admin messages" ON public.admin_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view own admin messages" ON public.admin_messages
    FOR SELECT USING (sender_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR ALL USING (user_id = auth.uid());

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Recursive policies fixed successfully!';
    RAISE NOTICE 'Admin access will be handled at the application level for now.';
END $$;
