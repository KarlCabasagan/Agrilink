-- Supabase Storage Setup for Agrilink
-- Run these commands in your Supabase SQL Editor

-- 1. Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('products', 'products', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for authenticated users to upload product images
CREATE POLICY "Allow authenticated users to upload product images" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'products' 
    AND auth.role() = 'authenticated'
  );

-- 4. Create policy for authenticated users to upload avatar images
CREATE POLICY "Allow authenticated users to upload avatar images" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

-- 5. Create policy for users to update their own uploads
CREATE POLICY "Allow users to update their own uploads" ON storage.objects
  FOR UPDATE 
  USING (
    (bucket_id = 'products' OR bucket_id = 'avatars') 
    AND auth.role() = 'authenticated'
  )
  WITH CHECK (
    (bucket_id = 'products' OR bucket_id = 'avatars') 
    AND auth.role() = 'authenticated'
  );

-- 6. Create policy for users to delete their own uploads
CREATE POLICY "Allow users to delete their own uploads" ON storage.objects
  FOR DELETE 
  USING (
    (bucket_id = 'products' OR bucket_id = 'avatars') 
    AND auth.role() = 'authenticated'
  );

-- 7. Create policy for public read access to all images
CREATE POLICY "Allow public read access to all images" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'products' OR bucket_id = 'avatars'
  );

-- 8. Optional: Create more restrictive policies if needed
-- Uncomment and modify these if you want users to only access their own files

-- CREATE POLICY "Users can only upload to their own folder" ON storage.objects
--   FOR INSERT 
--   WITH CHECK (
--     bucket_id IN ('products', 'avatars') 
--     AND auth.role() = 'authenticated'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

-- CREATE POLICY "Users can only delete their own files" ON storage.objects
--   FOR DELETE 
--   USING (
--     bucket_id IN ('products', 'avatars') 
--     AND auth.role() = 'authenticated'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
