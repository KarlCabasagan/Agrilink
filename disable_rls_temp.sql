-- Temporary: Disable RLS for testing
-- CAUTION: This makes storage less secure, only for testing!

-- Disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- To re-enable later:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
