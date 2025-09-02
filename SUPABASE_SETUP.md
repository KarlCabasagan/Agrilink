# Supabase Profiles Table Setup

## Recommended Profiles Table Structure

Run this SQL in your Supabase SQL Editor to create the optimal profiles table:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    address TEXT,
    contact TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

## Why This Approach is Better

### 1. **Automatic Profile Creation**

-   When a user signs up, a profile is automatically created
-   No need to handle profile creation in your app code

### 2. **Better Security**

-   Row Level Security ensures users can only access their own data
-   Proper policies for SELECT, UPDATE, and INSERT operations

### 3. **Data Integrity**

-   Foreign key relationship to auth.users ensures data consistency
-   CASCADE deletion removes profile when user is deleted

### 4. **Automatic Timestamps**

-   `created_at` and `updated_at` are handled automatically
-   No need to manually set timestamps in your app

### 5. **Scalability**

-   Easy to add more fields (avatar_url, bio, etc.)
-   Can create relationships with other tables easily

## App Benefits

With this setup, your React app becomes simpler:

-   No need to check if profile exists
-   No need to handle profile creation manually
-   All user data comes from one consistent source
-   Better performance with proper indexing

## Migration Steps

1. Run the SQL above in Supabase SQL Editor
2. Test that profiles are created automatically for new users
3. For existing users, run a migration to create their profiles:

```sql
-- Create profiles for existing users (run once)
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT id, email, created_at, updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
```
