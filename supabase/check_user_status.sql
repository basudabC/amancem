-- Check the current is_active status of all users
SELECT 
  id,
  email,
  full_name,
  is_active,
  updated_at
FROM profiles
ORDER BY email;

-- Check the specific user you're testing
-- Replace with the actual user ID from the console
SELECT 
  id,
  email,
  full_name,
  is_active,
  updated_at
FROM profiles
WHERE id = '28a5a6ec-1d2e-4f40-9b40-def1ce4581d2';
