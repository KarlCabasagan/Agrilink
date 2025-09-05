-- SQL to create avatars bucket in Supabase
-- Run this in your Supabase SQL Editor

-- 1. Create the avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS policy for avatars bucket
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view avatars
CREATE POLICY "Allow authenticated users to view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Allow users to update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own avatars
CREATE POLICY "Allow users to delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 3. Clean up any bad avatar URLs in profiles table
-- Remove error messages from avatar_url column
UPDATE profiles 
SET avatar_url = NULL 
WHERE avatar_url LIKE '%"success":false%' 
   OR avatar_url LIKE '%Upload failed%'
   OR avatar_url LIKE '%Bucket not found%';

-- Show affected rows
SELECT id, avatar_url FROM profiles WHERE avatar_url IS NOT NULL;
