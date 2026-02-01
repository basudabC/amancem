-- ============================================================
-- Add Hierarchical Reporting Structure to Profiles
-- ============================================================

-- Step 1: Add reports_to column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Step 2: Add constraint to prevent self-reporting
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS no_self_reporting;

ALTER TABLE profiles
ADD CONSTRAINT no_self_reporting CHECK (id != reports_to);

-- Step 3: Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_reports_to ON profiles(reports_to);

-- Step 4: Create recursive function to get all subordinate IDs
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

-- Step 5: Create helper function to get all accessible user IDs based on role
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

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'reports_to';

-- Test the function (will return empty if no reporting structure exists yet)
SELECT * FROM get_subordinate_ids(auth.uid());
