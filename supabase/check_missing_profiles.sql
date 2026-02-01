-- ============================================================
-- DIAGNOSTIC: Check auth users vs profiles
-- ============================================================

-- Check all auth users
SELECT 
  'Auth Users' as source,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
ORDER BY au.created_at DESC;

-- Check all profiles
SELECT 
  'Profiles' as source,
  p.id,
  p.email,
  p.full_name,
  p.employee_code,
  p.role,
  p.is_active,
  p.created_at
FROM profiles p
ORDER BY p.created_at DESC;

-- Find auth users WITHOUT profiles
SELECT 
  'Missing Profiles' as issue,
  au.id,
  au.email,
  au.created_at as auth_created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;
