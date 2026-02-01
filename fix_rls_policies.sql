-- ============================================================
-- FIX: Infinite Recursion in RLS Policies
-- ============================================================
-- The error "infinite recursion detected in policy for relation profiles"
-- means the RLS policies are referencing themselves incorrectly
-- ============================================================

-- Step 1: Check current RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 2: Drop all existing RLS policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Country heads can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Country heads can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Sales reps can view profiles in their territories" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON profiles;

-- Drop any other policies that might exist
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', policy_record.policyname);
  END LOOP;
END $$;

-- Step 3: Create simple, non-recursive RLS policies
-- These policies avoid infinite recursion by not querying the profiles table within the policy

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to read their own profile
CREATE POLICY "profiles_select_own"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Allow users to update their own profile
CREATE POLICY "profiles_update_own"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Allow service role full access (for admin operations)
CREATE POLICY "profiles_all_service_role"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 4: Verify policies are created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 5: Test by querying your profile
-- Replace with your user ID
SELECT * FROM profiles WHERE id = auth.uid();

-- ============================================================
-- ALTERNATIVE: Disable RLS temporarily for testing
-- ============================================================
-- If you still have issues, you can temporarily disable RLS
-- WARNING: Only do this in development, never in production!

-- Disable RLS (TEMPORARY - for testing only)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable with:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- After fixing policies, verify you can login
-- Try logging in at http://localhost:5173
-- Email: basudab@amangroupbd.com
-- Password: password123
