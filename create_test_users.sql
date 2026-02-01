-- ============================================================
-- AMAN CEMENT CRM - CREATE TEST USERS
-- ============================================================
-- Run this SQL in your Supabase SQL Editor to create test users
-- ============================================================

-- IMPORTANT: First, you need to create the auth users, then create profiles
-- Supabase requires users to be created through the auth.users table

-- ============================================================
-- METHOD 1: Create users via Supabase Dashboard (RECOMMENDED)
-- ============================================================
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" button
-- 3. Create users with these credentials:
--
-- ADMIN USER:
--   Email: admin@amancement.com
--   Password: Admin@123
--   Auto Confirm: YES
--
-- SALES REP USER:
--   Email: salesrep@amancement.com
--   Password: Sales@123
--   Auto Confirm: YES
--
-- 4. After creating users in the dashboard, note their UUIDs
-- 5. Then run the SQL below to create their profiles

-- ============================================================
-- METHOD 2: Create users via SQL (if Method 1 doesn't work)
-- ============================================================
-- Note: This creates the auth user and profile in one go
-- Replace the UUIDs with actual UUIDs from auth.users after creation

-- First, let's create a helper function to create users
CREATE OR REPLACE FUNCTION create_test_user(
  user_email TEXT,
  user_password TEXT,
  user_role TEXT,
  user_full_name TEXT,
  user_employee_code TEXT
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Create auth user (this might not work in SQL editor, use dashboard instead)
  -- This is just for reference
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Create profile
  INSERT INTO profiles (
    id,
    employee_code,
    full_name,
    email,
    role,
    region,
    area,
    target_monthly,
    is_active
  ) VALUES (
    new_user_id,
    user_employee_code,
    user_full_name,
    user_email,
    user_role,
    'North',
    'Area 1',
    100000,
    true
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- METHOD 3: Manual Profile Creation (EASIEST)
-- ============================================================
-- After creating users via Supabase Dashboard, run this:
-- Replace the UUIDs with the actual UUIDs from your created users

-- Example: If your admin user has UUID: 12345678-1234-1234-1234-123456789012
-- And sales rep has UUID: 87654321-4321-4321-4321-210987654321

-- STEP 1: Create Admin Profile
-- Replace 'YOUR-ADMIN-USER-UUID-HERE' with actual UUID from auth.users
INSERT INTO profiles (
  id,
  employee_code,
  full_name,
  email,
  role,
  region,
  area,
  territory_ids,
  target_monthly,
  is_active
) VALUES (
  'YOUR-ADMIN-USER-UUID-HERE'::uuid,  -- Replace with actual UUID
  'EMP001',
  'Admin User',
  'admin@amancement.com',
  'country_head',
  'National',
  'Head Office',
  ARRAY[]::uuid[],  -- Country head has access to all territories
  0,  -- No sales target for admin
  true
) ON CONFLICT (id) DO UPDATE SET
  employee_code = EXCLUDED.employee_code,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- STEP 2: Create Sales Rep Profile
-- Replace 'YOUR-SALESREP-USER-UUID-HERE' with actual UUID from auth.users
INSERT INTO profiles (
  id,
  employee_code,
  full_name,
  email,
  role,
  region,
  area,
  territory_ids,
  target_monthly,
  is_active
) VALUES (
  'YOUR-SALESREP-USER-UUID-HERE'::uuid,  -- Replace with actual UUID
  'EMP002',
  'Sales Representative',
  'salesrep@amancement.com',
  'sales_rep',
  'North Region',
  'Area 1',
  ARRAY[]::uuid[],  -- Add territory UUIDs here if you have territories
  100000,  -- 100k monthly target
  true
) ON CONFLICT (id) DO UPDATE SET
  employee_code = EXCLUDED.employee_code,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- ============================================================
-- QUICK REFERENCE: Get User UUIDs
-- ============================================================
-- Run this to see all auth users and their UUIDs:
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- Run this to see all profiles:
SELECT 
  id,
  employee_code,
  full_name,
  email,
  role,
  is_active
FROM profiles
ORDER BY created_at DESC;

-- ============================================================
-- VERIFICATION QUERY
-- ============================================================
-- Run this to verify users are created correctly:
SELECT 
  u.id,
  u.email as auth_email,
  u.email_confirmed_at,
  p.employee_code,
  p.full_name,
  p.role,
  p.is_active
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
