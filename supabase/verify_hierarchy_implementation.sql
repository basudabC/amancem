-- ============================================================
-- Verification Queries for Hierarchy Management Implementation
-- Run these queries in your Supabase SQL Editor to verify the changes
-- ============================================================

-- 1. Check if reports_to column exists in profiles table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'reports_to';

-- Expected: Should return one row showing reports_to column exists

-- ============================================================

-- 2. Check if the no_self_reporting constraint exists
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'profiles' 
  AND constraint_name = 'no_self_reporting';

-- Expected: Should return one row with constraint_type = 'CHECK'

-- ============================================================

-- 3. Check if the index on reports_to exists
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles' 
  AND indexname = 'idx_profiles_reports_to';

-- Expected: Should return one row showing the index definition

-- ============================================================

-- 4. Verify hierarchy functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name IN ('get_subordinate_ids', 'get_accessible_user_ids')
ORDER BY routine_name;

-- Expected: Should return 2 rows (one for each function)

-- ============================================================

-- 5. View current user hierarchy (actual data)
SELECT 
  p.id,
  p.employee_code,
  p.full_name,
  p.role,
  p.reports_to,
  m.full_name AS manager_name,
  m.employee_code AS manager_code,
  m.role AS manager_role
FROM profiles p
LEFT JOIN profiles m ON p.reports_to = m.id
WHERE p.is_active = true
ORDER BY 
  CASE p.role
    WHEN 'country_head' THEN 1
    WHEN 'regional_manager' THEN 2
    WHEN 'area_manager' THEN 3
    WHEN 'supervisor' THEN 4
    WHEN 'sales_rep' THEN 5
  END,
  p.full_name;

-- Expected: Shows all users with their managers (if assigned)

-- ============================================================

-- 6. Test the get_subordinate_ids function
-- Replace 'USER_ID_HERE' with an actual manager's user ID
SELECT 
  p.full_name,
  p.employee_code,
  p.role
FROM profiles p
WHERE p.id IN (
  SELECT subordinate_id 
  FROM get_subordinate_ids('USER_ID_HERE')
)
ORDER BY p.full_name;

-- Expected: Returns all subordinates (direct and indirect) of the specified manager

-- ============================================================

-- 7. Test the get_accessible_user_ids function
-- Replace 'USER_ID_HERE' with an actual user's ID
SELECT 
  p.full_name,
  p.employee_code,
  p.role
FROM profiles p
WHERE p.id IN (
  SELECT accessible_id 
  FROM get_accessible_user_ids('USER_ID_HERE')
)
ORDER BY p.full_name;

-- Expected: Returns the user themselves + all their subordinates
-- (or all users if the user is a country_head)

-- ============================================================

-- 8. Check current RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Expected: Should show the new hierarchy-based policies:
-- - "Users can read own profile"
-- - "Users can read accessible profiles via hierarchy"
-- - "Users can update own profile"
-- - "Managers can update subordinate profiles"

-- ============================================================

-- 9. Verify no circular hierarchies exist
WITH RECURSIVE hierarchy_check AS (
  SELECT 
    id,
    reports_to,
    ARRAY[id] AS path,
    1 AS depth
  FROM profiles
  WHERE reports_to IS NOT NULL
  
  UNION ALL
  
  SELECT 
    hc.id,
    p.reports_to,
    hc.path || p.id,
    hc.depth + 1
  FROM hierarchy_check hc
  JOIN profiles p ON hc.reports_to = p.id
  WHERE p.reports_to IS NOT NULL
    AND NOT (p.id = ANY(hc.path))  -- Detect circular reference
    AND hc.depth < 10  -- Prevent infinite loops
)
SELECT 
  p.full_name,
  p.employee_code,
  p.role,
  hc.depth AS hierarchy_depth,
  hc.path
FROM hierarchy_check hc
JOIN profiles p ON hc.id = p.id
WHERE array_length(hc.path, 1) > 1  -- Show only those with managers
ORDER BY hc.depth DESC, p.full_name;

-- Expected: Should show hierarchy depth for each user
-- If any circular references exist, the query will show them

-- ============================================================

-- 10. Count users by role and their reporting status
SELECT 
  role,
  COUNT(*) AS total_users,
  COUNT(reports_to) AS users_with_manager,
  COUNT(*) - COUNT(reports_to) AS users_without_manager
FROM profiles
WHERE is_active = true
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'country_head' THEN 1
    WHEN 'regional_manager' THEN 2
    WHEN 'area_manager' THEN 3
    WHEN 'supervisor' THEN 4
    WHEN 'sales_rep' THEN 5
  END;

-- Expected: Shows breakdown of users by role and whether they have a manager assigned

-- ============================================================

-- 11. Find users who should have a manager but don't
SELECT 
  p.id,
  p.employee_code,
  p.full_name,
  p.role,
  p.reports_to
FROM profiles p
WHERE p.is_active = true
  AND p.role != 'country_head'  -- Country heads don't need managers
  AND p.reports_to IS NULL
ORDER BY 
  CASE p.role
    WHEN 'regional_manager' THEN 1
    WHEN 'area_manager' THEN 2
    WHEN 'supervisor' THEN 3
    WHEN 'sales_rep' THEN 4
  END,
  p.full_name;

-- Expected: Shows users who need a manager assigned
-- (Empty result means everyone has proper hierarchy)

-- ============================================================
-- END OF VERIFICATION QUERIES
-- ============================================================
