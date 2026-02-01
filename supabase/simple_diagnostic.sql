-- ============================================================
-- SIMPLE DIAGNOSTIC: Check what's in the database
-- ============================================================

-- 1. Count auth users
SELECT 'Total Auth Users' as info, COUNT(*) as count
FROM auth.users;

-- 2. Count profiles
SELECT 'Total Profiles' as info, COUNT(*) as count
FROM profiles;

-- 3. Show all profiles (what the app sees)
SELECT 
  id,
  email,
  full_name,
  employee_code,
  role,
  is_active
FROM profiles
ORDER BY created_at DESC;

-- 4. Check if there's an RLS issue
-- Try this as the admin user to see if RLS is blocking
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '6d9e4c42-eaac-4028-8eee-656ddc29c2cf'; -- Replace with your admin user ID

SELECT COUNT(*) as visible_profiles FROM profiles;
