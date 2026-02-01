-- ============================================================
-- CREATE USER FUNCTION
-- Allows admins to create new users via SQL function
-- ============================================================

-- Function to create a new user (requires country_head role)
CREATE OR REPLACE FUNCTION create_new_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_employee_code TEXT,
  p_role TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Check if caller is country_head
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'country_head'
  ) THEN
    RAISE EXCEPTION 'Only country head can create users';
  END IF;

  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  -- Check if employee code already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE employee_code = p_employee_code) THEN
    RAISE EXCEPTION 'User with this employee code already exists';
  END IF;

  -- Generate new user ID
  v_user_id := gen_random_uuid();

  -- Insert into profiles table
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
  ) VALUES (
    v_user_id,
    p_email,
    p_full_name,
    p_employee_code,
    p_role::user_role,
    p_phone,
    true,
    NOW(),
    NOW()
  );

  -- Return success with user details
  v_result := json_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email,
    'message', 'User profile created. User needs to complete signup at login page.'
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_new_user TO authenticated;

COMMENT ON FUNCTION create_new_user IS 'Creates a new user profile. User must complete signup separately. Only country_head can execute.';
