-- =================================
-- AGRILINK DATABASE SETUP SCRIPT
-- =================================
-- Run this script in your Supabase SQL Editor to create all necessary tables and relationships

-- =================================
-- 1. ROLES & USER PROFILES
-- =================================

-- Create roles table for role-based access control
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO public.roles (id, name, description) VALUES
    (1, 'Consumer', 'Regular customers who purchase products'),
    (2, 'Producer', 'Farmers who sell products'),
    (3, 'Admin', 'System administrators')
ON CONFLICT (id) DO NOTHING;

-- Create enhanced profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    name TEXT,
    address TEXT,
    contact TEXT,
    avatar_url TEXT,
    role_id INTEGER REFERENCES public.roles(id) DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    email_verified BOOLEAN DEFAULT FALSE,
    producer_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================
-- 2. PRODUCTS & CATEGORIES
-- =================================

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.categories (name, description, icon) VALUES
    ('Vegetables', 'Fresh vegetables and leafy greens', 'mingcute:leaf-line'),
    ('Fruits', 'Fresh seasonal fruits', 'mingcute:apple-line'),
    ('Legumes', 'Beans, lentils, and other legumes', 'mingcute:plant-line'),
    ('Grains', 'Rice, corn, and other grain products', 'mingcute:wheat-line'),
    ('Herbs', 'Cooking herbs and spices', 'mingcute:herb-line')
ON CONFLICT (name) DO NOTHING;

-- Create crop types table for recommendations
CREATE TABLE IF NOT EXISTS public.crop_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category_id INTEGER REFERENCES public.categories(id),
    description TEXT,
    growing_season TEXT,
    harvest_time TEXT,
    recommended_soil TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default crop types
INSERT INTO public.crop_types (name, category_id, description) VALUES
    ('Sweet Potato', 1, 'Nutritious root vegetable'),
    ('Lettuce', 1, 'Leafy green vegetable'),
    ('Bell Peppers', 1, 'Colorful sweet peppers'),
    ('Cabbage', 1, 'Cruciferous vegetable'),
    ('Tomatoes', 1, 'Popular cooking vegetable'),
    ('Carrots', 1, 'Orange root vegetable'),
    ('Rice', 4, 'Staple grain crop'),
    ('Corn', 4, 'Sweet corn variety')
ON CONFLICT (name) DO NOTHING;

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock DECIMAL(10,2) DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    category_id INTEGER REFERENCES public.categories(id),
    crop_type_id INTEGER REFERENCES public.crop_types(id),
    image_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_approval', 'rejected')),
    minimum_order_quantity DECIMAL(10,2) DEFAULT 1.0,
    delivery_cost DECIMAL(10,2) DEFAULT 50.0,
    pickup_location TEXT,
    approval_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================
-- 3. SHOPPING CART & FAVORITES
-- =================================

-- Create cart items table
CREATE TABLE IF NOT EXISTS public.cart_items (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- =================================
-- 4. ORDERS & TRANSACTIONS
-- =================================

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
    payment_method TEXT DEFAULT 'cod' CHECK (payment_method IN ('cod', 'gcash', 'paymaya', 'bank_transfer')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    delivery_method TEXT DEFAULT 'pickup' CHECK (delivery_method IN ('pickup', 'delivery')),
    delivery_address TEXT,
    pickup_location TEXT,
    delivery_fee DECIMAL(10,2) DEFAULT 0.0,
    subtotal DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    customer_notes TEXT,
    estimated_delivery_date DATE,
    estimated_pickup_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id),
    product_name TEXT NOT NULL, -- Store product name at time of order
    farmer_id UUID REFERENCES public.profiles(id),
    farmer_name TEXT NOT NULL, -- Store farmer name at time of order
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================
-- 5. REVIEWS & RATINGS
-- =================================

-- Create product reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES public.orders(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'reported')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, customer_id, order_id)
);

-- =================================
-- 6. MESSAGING SYSTEM
-- =================================

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id SERIAL PRIMARY KEY,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, farmer_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin messages table for system communications
CREATE TABLE IF NOT EXISTS public.admin_messages (
    id SERIAL PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('consumer', 'producer')),
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'product_approval', 'report', 'account', 'technical')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'resolved', 'archived')),
    admin_response TEXT,
    responded_by UUID REFERENCES public.profiles(id),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================
-- 7. PRODUCER APPLICATION SYSTEM
-- =================================

-- Create producer applications table
CREATE TABLE IF NOT EXISTS public.producer_applications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_address TEXT NOT NULL,
    business_type TEXT NOT NULL,
    farm_size TEXT,
    crops_grown TEXT[],
    years_experience INTEGER,
    contact_person TEXT,
    contact_phone TEXT,
    business_permit TEXT, -- URL to uploaded permit
    barangay_clearance TEXT, -- URL to uploaded clearance
    additional_documents TEXT[], -- URLs to additional documents
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================
-- 8. SYSTEM LOGS & ANALYTICS
-- =================================

-- Create activity logs table for admin monitoring
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT, -- 'user', 'product', 'order', etc.
    entity_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'order', 'product', 'system', 'promotion')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================
-- 9. ENABLE ROW LEVEL SECURITY
-- =================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =================================
-- 10. CREATE SECURITY POLICIES
-- =================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Products policies
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

-- Orders policies
CREATE POLICY "Customers can view own orders" ON public.orders
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Farmers can view orders for their products" ON public.orders
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.order_items oi
        JOIN public.products p ON oi.product_id = p.id
        WHERE oi.order_id = public.orders.id AND p.farmer_id = auth.uid()
    ));

-- Order items policies
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

-- Admin messages policies
CREATE POLICY "Users can create admin messages" ON public.admin_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view own admin messages" ON public.admin_messages
    FOR SELECT USING (sender_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR ALL USING (user_id = auth.uid());

-- =================================
-- 11. CREATE FUNCTIONS & TRIGGERS
-- =================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, email_verified, created_at, updated_at)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.email_confirmed_at IS NOT NULL, false), NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for relevant tables
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_products_updated ON public.products;
CREATE TRIGGER on_products_updated
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_orders_updated ON public.orders;
CREATE TRIGGER on_orders_updated
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_cart_items_updated ON public.cart_items;
CREATE TRIGGER on_cart_items_updated
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating conversation timestamp
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_activity(
    p_user_id UUID,
    p_action TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_details, inet_client_addr());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================
-- 12. CREATE INDEXES FOR PERFORMANCE
-- =================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_farmer_id ON public.products(farmer_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_farmer_id ON public.order_items(farmer_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

-- =================================
-- 13. SAMPLE DATA (OPTIONAL)
-- =================================

-- Insert sample data for testing (uncomment if needed)
/*
-- Sample consumer
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'consumer@test.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Sample producer
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'producer@test.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Update profile roles
UPDATE public.profiles SET role_id = 1 WHERE id = '550e8400-e29b-41d4-a716-446655440000';
UPDATE public.profiles SET role_id = 2 WHERE id = '550e8400-e29b-41d4-a716-446655440001';
*/

-- =================================
-- SETUP COMPLETE!
-- =================================

-- Create a view for order summary statistics
CREATE OR REPLACE VIEW public.order_statistics AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_order_value
FROM public.orders
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Create a view for product statistics
CREATE OR REPLACE VIEW public.product_statistics AS
SELECT 
    p.id,
    p.name,
    p.farmer_id,
    pr.name as farmer_name,
    COUNT(oi.id) as total_orders,
    SUM(oi.quantity) as total_sold,
    SUM(oi.total_price) as total_revenue,
    AVG(rev.rating) as average_rating,
    COUNT(rev.id) as total_reviews
FROM public.products p
LEFT JOIN public.profiles pr ON p.farmer_id = pr.id
LEFT JOIN public.order_items oi ON p.id = oi.product_id
LEFT JOIN public.orders o ON oi.order_id = o.id AND o.status = 'completed'
LEFT JOIN public.product_reviews rev ON p.id = rev.product_id AND rev.status = 'active'
GROUP BY p.id, p.name, p.farmer_id, pr.name;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Agrilink database setup completed successfully!';
    RAISE NOTICE 'Tables created: profiles, products, orders, cart_items, favorites, messages, etc.';
    RAISE NOTICE 'Security policies enabled with Row Level Security';
    RAISE NOTICE 'Triggers and functions created for automation';
    RAISE NOTICE 'Indexes created for optimal performance';
    RAISE NOTICE 'Your Agrilink app is now ready to use with Supabase!';
END $$;
