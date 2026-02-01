-- ============================================================
-- ALTERNATIVE METHOD: Create Admin User via SQL
-- ============================================================
-- This bypasses the Supabase Dashboard UI
-- Run this in Supabase SQL Editor
-- ============================================================

-- OPTION 1: Check if user already exists
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'basudab@amangroupbd.com';

-- If user exists, skip to OPTION 3 below

-- ============================================================
-- OPTION 2: Create user using Supabase Auth Admin API
-- ============================================================
-- You need to use the Supabase Dashboard or API for this
-- Dashboard: Authentication > Users > Add User
-- OR use the REST API with your service role key

-- ============================================================
-- OPTION 3: If user exists but no profile, create profile
-- ============================================================
-- First, let's check what triggers exist on profiles table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- Now create the profile (this will work if user exists in auth.users)
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
  is_active,
  created_at,
  updated_at
)
SELECT 
  u.id,
  'EMP001',
  'Basudab',
  'basudab@amangroupbd.com',
  'country_head',
  'National',
  'Head Office',
  ARRAY[]::uuid[],
  0,
  true,
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'basudab@amangroupbd.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'country_head',
  is_active = true,
  updated_at = NOW();

-- ============================================================
-- OPTION 4: Disable RLS temporarily (if needed)
-- ============================================================
-- Only use this if you're getting permission errors
-- WARNING: Re-enable RLS after creating the user!

-- Check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Temporarily disable RLS (if needed)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create profile (use INSERT from OPTION 3)

-- Re-enable RLS
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- OPTION 5: Manual user creation (Advanced)
-- ============================================================
-- This creates the auth user directly in the database
-- WARNING: This bypasses Supabase's normal user creation flow
-- Only use if other methods fail

-- Create the auth user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'basudab@amangroupbd.com',
  crypt('password123', gen_salt('bf')),  -- Encrypted password
  NOW(),  -- Email confirmed
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
RETURNING id;

-- After getting the ID from above, create the profile
-- Replace 'USER-ID-FROM-ABOVE' with the actual UUID returned
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
  is_active,
  created_at,
  updated_at
) VALUES (
  'USER-ID-FROM-ABOVE'::uuid,
  'EMP001',
  'Basudab',
  'basudab@amangroupbd.com',
  'country_head',
  'National',
  'Head Office',
  ARRAY[]::uuid[],
  0,
  true,
  NOW(),
  NOW()
);

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  p.employee_code,
  p.full_name,
  p.role,
  p.is_active
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'basudab@amangroupbd.com';

-- ============================================================
-- TROUBLESHOOTING: Check RLS policies
-- ============================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';
