-- ============================================================
-- ROLLBACK: Remove the problematic policies
-- ============================================================

-- Remove the policies that caused infinite recursion
DROP POLICY IF EXISTS "Country head can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Country head can manage all profiles" ON profiles;

-- The original policies from schema.sql should still be in place
-- If not, we'll need to restore them
