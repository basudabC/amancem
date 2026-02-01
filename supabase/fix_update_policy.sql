-- ============================================================
-- FIX: Add UPDATE policies without infinite recursion
-- ============================================================

-- Drop the problematic policy if it exists
DROP POLICY IF EXISTS "profiles_update_country_head" ON profiles;

-- Allow all authenticated users to update any profile
-- (We'll refine this later for better security)
CREATE POLICY "profiles_update_all"
ON profiles FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify the policies
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;
