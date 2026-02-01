-- ============================================================
-- FIX: Create profiles for existing auth users
-- ============================================================

-- This will create profiles for any auth users that don't have one
-- You'll need to manually set the role, employee_code, etc. for each user

INSERT INTO profiles (
  id,
  email,
  full_name,
  employee_code,
  role,
  phone,
  is_active,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Unknown User'),
  COALESCE(au.raw_user_meta_data->>'employee_code', 'TEMP_' || SUBSTRING(au.id::text, 1, 8)),
  'sales_rep'::user_role, -- Default role, change as needed
  au.phone,
  true,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- After running this, you should manually update the roles and employee codes
-- for the newly created profiles in the Supabase dashboard or with UPDATE statements
