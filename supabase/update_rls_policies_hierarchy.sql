-- ============================================================
-- Update RLS Policies to Use Hierarchy Functions
-- Run this to update existing policies in the database
-- ============================================================

-- Drop old policies
DROP POLICY IF EXISTS "Sales reps can read supervisor profile" ON profiles;
DROP POLICY IF EXISTS "Supervisors can read team profiles" ON profiles;
DROP POLICY IF EXISTS "Area managers can read area profiles" ON profiles;
DROP POLICY IF EXISTS "Regional managers can read region profiles" ON profiles;
DROP POLICY IF EXISTS "Country heads can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Managers can update subordinate profiles" ON profiles;

-- Create new hierarchy-based policies
CREATE POLICY "Users can read accessible profiles via hierarchy"
  ON profiles FOR SELECT
  USING (
    id IN (SELECT accessible_id FROM get_accessible_user_ids(auth.uid()))
  );

CREATE POLICY "Managers can update subordinate profiles"
  ON profiles FOR UPDATE
  USING (
    id IN (SELECT accessible_id FROM get_accessible_user_ids(auth.uid()))
    AND auth.uid() != id  -- Cannot update own profile through this policy
  );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
