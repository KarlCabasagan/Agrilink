-- =================================
-- FIX FARMER PROFILE VISIBILITY
-- =================================
-- This script adds policies to allow consumers to view basic farmer profile information

-- Add policy to allow viewing farmer profiles (for display in products, cart, etc.)
DROP POLICY IF EXISTS "Anyone can view farmer profile info" ON public.profiles;

CREATE POLICY "Anyone can view farmer profile info" ON public.profiles
    FOR SELECT USING (
        -- Allow viewing own profile
        auth.uid() = id 
        OR 
        -- Allow viewing profiles of farmers who have products (for consumer display)
        EXISTS (
            SELECT 1 FROM public.products 
            WHERE products.farmer_id = profiles.id 
            AND products.status = 'active'
        )
    );
