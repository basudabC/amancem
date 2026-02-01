-- ============================================================
-- FIX: Database Trigger Issue Preventing User Creation
-- ============================================================

-- Step 1: Check what triggers exist on auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'auth'
ORDER BY trigger_name;

-- Step 2: Check the handle_new_user function (if it exists)
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- Step 3: Check profiles table constraints
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE con.contype
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 't' THEN 'TRIGGER'
        ELSE con.contype::text
    END AS constraint_type_desc,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'profiles'
AND nsp.nspname = 'public'
ORDER BY con.contype, con.conname;

-- Step 4: Drop the problematic trigger if it exists
-- (Uncomment if you find a trigger causing issues)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 5: Create a better trigger that handles all required fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    employee_code,
    role,
    region,
    area,
    territory_ids,
    target_monthly,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'EMP' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
    'sales_rep',  -- Default role
    'Unassigned',
    'Unassigned',
    ARRAY[]::uuid[],
    0,
    true,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Test by creating a user
-- Now try creating a user in the Supabase Dashboard

-- Step 8: After creating user, update to admin
-- Replace 'USER-EMAIL' with the email you just created
UPDATE profiles
SET 
  role = 'country_head',
  employee_code = 'ADMIN001',
  full_name = 'Basudab',
  region = 'National',
  area = 'Head Office',
  is_active = true,
  updated_at = NOW()
WHERE email = 'USER-EMAIL';

-- Step 9: Verify
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.employee_code,
  p.full_name,
  p.role,
  p.is_active
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
