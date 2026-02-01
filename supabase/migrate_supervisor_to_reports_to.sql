-- ============================================================
-- Migrate supervisor_id to reports_to and Add Hierarchy Functions
-- This migration standardizes the reporting hierarchy implementation
-- ============================================================

-- Step 1: Rename column if it exists (from supervisor_id to reports_to)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'supervisor_id'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN supervisor_id TO reports_to;
    RAISE NOTICE 'Renamed supervisor_id to reports_to';
  ELSE
    RAISE NOTICE 'Column supervisor_id does not exist, skipping rename';
  END IF;
END $$;

-- Step 2: Add reports_to column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Step 3: Add constraint to prevent self-reporting
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS no_self_reporting;

ALTER TABLE profiles
ADD CONSTRAINT no_self_reporting CHECK (id != reports_to);

-- Step 4: Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_reports_to ON profiles(reports_to);

-- Step 5: Add comment
COMMENT ON COLUMN profiles.reports_to IS 'Manager this user reports to in the organizational hierarchy';

-- Step 6: Create recursive function to get all subordinate IDs
CREATE OR REPLACE FUNCTION get_subordinate_ids(manager_id UUID)
RETURNS TABLE(subordinate_id UUID) AS $$
  WITH RECURSIVE subordinates AS (
    -- Base case: direct reports
    SELECT id FROM profiles WHERE reports_to = manager_id
    UNION
    -- Recursive case: reports of reports
    SELECT p.id FROM profiles p
    INNER JOIN subordinates s ON p.reports_to = s.id
  )
  SELECT id FROM subordinates;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_subordinate_ids IS 'Recursively get all subordinate user IDs for a given manager';

-- Step 7: Create helper function to get all accessible user IDs based on role
CREATE OR REPLACE FUNCTION get_accessible_user_ids(user_id UUID)
RETURNS TABLE(accessible_id UUID) AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  -- Country head sees everyone
  IF user_role = 'country_head' THEN
    RETURN QUERY SELECT id FROM profiles;
  -- Everyone else sees themselves + their subordinates
  ELSE
    RETURN QUERY 
      SELECT user_id AS accessible_id
      UNION
      SELECT subordinate_id FROM get_subordinate_ids(user_id);
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_accessible_user_ids IS 'Get all user IDs accessible to a given user based on reporting hierarchy';

-- Step 8: Update RLS policies to use hierarchy functions
-- Drop old policies that use supervisor_id or geographic-based access
DROP POLICY IF EXISTS "Sales reps can read supervisor profile" ON profiles;
DROP POLICY IF EXISTS "Supervisors can read team profiles" ON profiles;
DROP POLICY IF EXISTS "Area managers can read area profiles" ON profiles;
DROP POLICY IF EXISTS "Regional managers can read region profiles" ON profiles;
DROP POLICY IF EXISTS "Managers can update subordinate profiles" ON profiles;

-- Create new hierarchy-based policies
CREATE POLICY "Users can read accessible profiles"
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

-- Verification queries
DO $$
BEGIN
  RAISE NOTICE '=== Migration Complete ===';
  RAISE NOTICE 'Verifying changes...';
END $$;

-- Verify column exists
SELECT 
  'Column reports_to exists: ' || 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'reports_to'
  ) THEN 'YES' ELSE 'NO' END AS verification;

-- Verify constraint exists
SELECT 
  'Constraint no_self_reporting exists: ' || 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' AND constraint_name = 'no_self_reporting'
  ) THEN 'YES' ELSE 'NO' END AS verification;

-- Verify index exists
SELECT 
  'Index idx_profiles_reports_to exists: ' || 
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'profiles' AND indexname = 'idx_profiles_reports_to'
  ) THEN 'YES' ELSE 'NO' END AS verification;

-- Verify functions exist
SELECT 
  'Function get_subordinate_ids exists: ' || 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'get_subordinate_ids'
  ) THEN 'YES' ELSE 'NO' END AS verification;

SELECT 
  'Function get_accessible_user_ids exists: ' || 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'get_accessible_user_ids'
  ) THEN 'YES' ELSE 'NO' END AS verification;
