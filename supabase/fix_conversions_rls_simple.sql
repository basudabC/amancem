-- SIMPLIFIED RLS FIX - Allow all authenticated users to read conversions
-- This will unblock the customer card display

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert their own conversions" ON conversions;
DROP POLICY IF EXISTS "Users can view their own conversions" ON conversions;
DROP POLICY IF EXISTS "Users can view conversions" ON conversions;
DROP POLICY IF EXISTS "Users can update their own conversions" ON conversions;
DROP POLICY IF EXISTS "Users can delete their own conversions" ON conversions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON conversions;

-- 1. INSERT: Users can insert their own conversions
CREATE POLICY "Users can insert their own conversions"
ON conversions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = converted_by);

-- 2. SELECT: SIMPLIFIED - Allow all authenticated users to read
CREATE POLICY "Enable read access for authenticated users"
ON conversions
FOR SELECT
TO authenticated
USING (true);

-- 3. UPDATE: Users can update their own conversions
CREATE POLICY "Users can update their own conversions"
ON conversions
FOR UPDATE
TO authenticated
USING (auth.uid() = converted_by)
WITH CHECK (auth.uid() = converted_by);

-- 4. DELETE: Users can delete their own conversions
CREATE POLICY "Users can delete their own conversions"
ON conversions
FOR DELETE
TO authenticated
USING (auth.uid() = converted_by);

-- Ensure RLS is enabled
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE tablename = 'conversions'
ORDER BY cmd, policyname;

-- Test if you can now see conversions
SELECT 
    COUNT(*) as total_conversions,
    SUM(total_value) as total_value,
    SUM(quantity_bags) as total_bags
FROM conversions;
