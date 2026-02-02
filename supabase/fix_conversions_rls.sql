-- ============================================================
-- FIX CONVERSIONS VISIBILITY (RLS)
-- Enables Hierarchy-based access for Sales/Conversions
-- ============================================================

-- 1. Enable RLS on Conversions if not already
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh
DROP POLICY IF EXISTS "hierarchy_view_conversions" ON conversions;
DROP POLICY IF EXISTS "Users can view their own conversions" ON conversions;
DROP POLICY IF EXISTS "Enable read access for all users" ON conversions;

-- 3. Create the comprehensive policy
-- Depends on 'get_recursive_subordinates' (already fixed with search_path=public)
CREATE POLICY "hierarchy_view_conversions" ON conversions
FOR SELECT
USING (
  -- A. Country Head sees all
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'country_head'
  OR
  -- B. Own Sales
  converted_by = auth.uid()
  OR
  -- C. Team Sales (Manager Hierarchy)
  converted_by IN (
    SELECT id FROM get_recursive_subordinates(auth.uid())
  )
);

-- 4. Grant access to 'authenticated' role
GRANT SELECT, INSERT, UPDATE, DELETE ON conversions TO authenticated;

-- 5. Force schema reload
NOTIFY pgrst, 'reload schema';
