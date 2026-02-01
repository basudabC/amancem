-- FINAL FIX - Completely remove and recreate RLS policies
-- This will definitely work

-- Step 1: Disable RLS
ALTER TABLE conversions DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can insert their own conversions" ON conversions;
DROP POLICY IF EXISTS "Users can view their own conversions" ON conversions;
DROP POLICY IF EXISTS "Users can view conversions" ON conversions;
DROP POLICY IF EXISTS "Users can update their own conversions" ON conversions;
DROP POLICY IF EXISTS "Users can delete their own conversions" ON conversions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON conversions;

-- Step 3: Create SIMPLE, PERMISSIVE policies
CREATE POLICY "allow_all_select"
ON conversions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_own_insert"
ON conversions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = converted_by);

CREATE POLICY "allow_own_update"
ON conversions
FOR UPDATE
TO authenticated
USING (auth.uid() = converted_by)
WITH CHECK (auth.uid() = converted_by);

CREATE POLICY "allow_own_delete"
ON conversions
FOR DELETE
TO authenticated
USING (auth.uid() = converted_by);

-- Step 4: Re-enable RLS
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify
SELECT tablename, policyname, cmd, permissive
FROM pg_policies
WHERE tablename = 'conversions'
ORDER BY cmd, policyname;

-- Step 6: Test query
SELECT COUNT(*) FROM conversions;
