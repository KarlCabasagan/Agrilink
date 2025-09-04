-- Alternative Storage RLS Setup
-- Run these ONE AT A TIME in Supabase SQL Editor

-- 1. Check if RLS is already enabled on storage.objects
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 2. Try to enable RLS (might work with service role)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create a simple policy for authenticated users
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id IN ('products', 'avatars'));

-- 4. Create policy for public read access
CREATE POLICY IF NOT EXISTS "Allow public read" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id IN ('products', 'avatars'));

-- 5. Create policy for authenticated updates
CREATE POLICY IF NOT EXISTS "Allow authenticated updates" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id IN ('products', 'avatars'))
WITH CHECK (bucket_id IN ('products', 'avatars'));

-- 6. Create policy for authenticated deletes
CREATE POLICY IF NOT EXISTS "Allow authenticated deletes" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id IN ('products', 'avatars'));
