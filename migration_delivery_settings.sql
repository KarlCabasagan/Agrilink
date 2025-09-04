-- =================================
-- MIGRATION: Move delivery_cost and minimum_order_quantity from products to profiles
-- =================================

-- First, add the new columns to profiles if they don't exist
DO $$
BEGIN
    -- Add delivery_cost if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'delivery_cost'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN delivery_cost DECIMAL(10,2) DEFAULT 50.0;
    END IF;
    
    -- Add minimum_order_quantity if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'minimum_order_quantity'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN minimum_order_quantity DECIMAL(10,2) DEFAULT 1.0;
    END IF;
    
    -- Add pickup_location if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'pickup_location'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN pickup_location TEXT;
    END IF;
END
$$;

-- Migrate existing data from products to profiles (for farmers who don't have these values set)
UPDATE public.profiles 
SET 
    delivery_cost = COALESCE(
        (SELECT AVG(delivery_cost) FROM public.products WHERE farmer_id = profiles.id AND delivery_cost IS NOT NULL), 
        50.0
    ),
    minimum_order_quantity = COALESCE(
        (SELECT AVG(minimum_order_quantity) FROM public.products WHERE farmer_id = profiles.id AND minimum_order_quantity IS NOT NULL), 
        1.0
    ),
    pickup_location = COALESCE(
        (SELECT pickup_location FROM public.products WHERE farmer_id = profiles.id AND pickup_location IS NOT NULL LIMIT 1), 
        pickup_location
    )
WHERE role_id = 2 -- Only for producers
AND (delivery_cost IS NULL OR minimum_order_quantity IS NULL);

-- Remove the old columns from products table if they exist
DO $$
BEGIN
    -- Remove delivery_cost column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'delivery_cost'
    ) THEN
        ALTER TABLE public.products DROP COLUMN delivery_cost;
    END IF;
    
    -- Remove minimum_order_quantity column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'minimum_order_quantity'
    ) THEN
        ALTER TABLE public.products DROP COLUMN minimum_order_quantity;
    END IF;
    
    -- Remove pickup_location column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'pickup_location'
    ) THEN
        ALTER TABLE public.products DROP COLUMN pickup_location;
    END IF;
END
$$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'delivery_cost and minimum_order_quantity moved to profiles table';
    RAISE NOTICE 'pickup_location moved to profiles table';
    RAISE NOTICE 'Old columns removed from products table';
END $$;
