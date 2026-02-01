-- ============================================================
-- EMERGENCY FIX: Remove infinite recursion policies
-- ============================================================

-- Drop ALL policies that cause recursion
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_service_role" ON profiles;
DROP POLICY IF EXISTS "profiles_select_country_head" ON profiles;
DROP POLICY IF EXISTS "profiles_all_country_head" ON profiles;
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

-- Temporarily disable RLS to restore access
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE policies that DON'T cause recursion
-- 1. Allow all authenticated users to read all profiles (temporary - we'll refine later)
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 2. Allow users to update their own profile
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Allow all authenticated users to insert (for user creation)
CREATE POLICY "profiles_insert_all"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Service role can do anything
CREATE POLICY "profiles_service_role"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
