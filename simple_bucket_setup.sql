-- Run these commands ONE AT A TIME in Supabase SQL Editor
-- If you get permission errors, use the Dashboard method instead

-- 1. First, just create the buckets (this usually works)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 2. Create the avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 3. Check if buckets were created
SELECT * FROM storage.buckets WHERE id IN ('products', 'avatars');
