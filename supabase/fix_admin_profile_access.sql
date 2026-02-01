-- ============================================================
-- FIX: Ensure profiles are visible to country_head
-- ============================================================

-- Allow country_head to see all profiles
DROP POLICY IF EXISTS "Country head can view all profiles" ON profiles;

CREATE POLICY "Country head can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'country_head'
  )
);

-- Allow country_head to insert/update profiles (for user creation)
DROP POLICY IF EXISTS "Country head can manage all profiles" ON profiles;

CREATE POLICY "Country head can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'country_head'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'country_head'
  )
);
