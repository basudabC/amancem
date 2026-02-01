-- Fix RLS policy for conversions table - COMPREHENSIVE FIX
-- The issue: SELECT policy is too restrictive and blocking queries

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert their own conversions" ON conversions;
DROP POLICY IF EXISTS "Users can view their own conversions" ON conversions;
DROP POLICY IF EXISTS "Users can update their own conversions" ON conversions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON conversions;

-- Create new, working RLS policies

-- 1. INSERT: Users can insert their own conversions
CREATE POLICY "Users can insert their own conversions"
ON conversions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = converted_by
);

-- 2. SELECT: Allow users to view conversions they created OR their team's conversions
CREATE POLICY "Users can view conversions"
ON conversions
FOR SELECT
TO authenticated
USING (
  -- User can see their own conversions
  auth.uid() = converted_by
  OR
  -- Managers can see their team's conversions
  EXISTS (
    SELECT 1 FROM profiles manager
    WHERE manager.id = auth.uid()
    AND manager.role IN ('supervisor', 'area_manager', 'regional_manager', 'country_head')
    AND EXISTS (
      SELECT 1 FROM profiles team_member
      WHERE team_member.id = conversions.converted_by
      AND (
        team_member.reports_to = manager.id
        OR team_member.id = manager.id
      )
    )
  )
  OR
  -- Country heads can see everything
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'country_head'
  )
);

-- 3. UPDATE: Users can update their own conversions
CREATE POLICY "Users can update their own conversions"
ON conversions
FOR UPDATE
TO authenticated
USING (auth.uid() = converted_by)
WITH CHECK (auth.uid() = converted_by);

-- 4. DELETE: Users can delete their own conversions (optional)
CREATE POLICY "Users can delete their own conversions"
ON conversions
FOR DELETE
TO authenticated
USING (auth.uid() = converted_by);

-- Verify RLS is enabled
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- Test the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'conversions'
ORDER BY cmd, policyname;

-- Check if current user can see conversions
SELECT 
    COUNT(*) as total_conversions,
    SUM(total_value) as total_value,
    SUM(quantity_bags) as total_bags
FROM conversions;
