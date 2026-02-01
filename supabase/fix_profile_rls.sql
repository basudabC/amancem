-- ============================================================
-- FIX: Ensure admin can see all profiles
-- This fixes the issue where profiles exist but aren't visible
-- ============================================================

-- First, let's check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_service_role" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Sales reps can read supervisor profile" ON profiles;
DROP POLICY IF EXISTS "Supervisors can read team profiles" ON profiles;
DROP POLICY IF EXISTS "Area managers can read area profiles" ON profiles;
DROP POLICY IF EXISTS "Regional managers can read region profiles" ON profiles;
DROP POLICY IF EXISTS "Country heads can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Managers can update subordinate profiles" ON profiles;
DROP POLICY IF EXISTS "Country heads can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Country heads can delete profiles" ON profiles;

-- Create simple, working policies
-- 1. Everyone can read their own profile
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Country heads can read ALL profiles
CREATE POLICY "profiles_select_country_head"
ON profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'country_head'
);

-- 3. Everyone can update their own profile
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Country heads can insert/update/delete any profile
CREATE POLICY "profiles_all_country_head"
ON profiles FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'country_head'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'country_head'
);

-- 5. Service role can do anything (for admin operations)
CREATE POLICY "profiles_service_role"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
