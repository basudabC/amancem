-- ============================================================
-- MIGRATION: Fix RLS Policies (Safe Version)
-- ============================================================
-- This only updates tables that exist
-- ============================================================

-- Step 1: Check what tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Step 2: Drop all existing RLS policies
DO $$
DECLARE
  policy_record RECORD;
  table_record RECORD;
BEGIN
  -- Loop through all public tables
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    -- Drop all policies for this table
    FOR policy_record IN 
      SELECT policyname 
      FROM pg_policies 
      WHERE tablename = table_record.tablename AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, table_record.tablename);
      RAISE NOTICE 'Dropped policy % on table %', policy_record.policyname, table_record.tablename;
    END LOOP;
  END LOOP;
END $$;

-- Step 3: Create simple RLS policies for profiles
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated
    USING (auth.uid() = id);
    
    CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    
    CREATE POLICY "profiles_service_role" ON profiles FOR ALL TO service_role
    USING (true) WITH CHECK (true);
    
    RAISE NOTICE '✅ Created policies for profiles table';
  END IF;
END $$;

-- Step 4: Create RLS policies for customers
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
    ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "customers_all_authenticated" ON customers FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
    
    CREATE POLICY "customers_service_role" ON customers FOR ALL TO service_role
    USING (true) WITH CHECK (true);
    
    RAISE NOTICE '✅ Created policies for customers table';
  END IF;
END $$;

-- Step 5: Create RLS policies for territories
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'territories') THEN
    ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "territories_all_authenticated" ON territories FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
    
    CREATE POLICY "territories_service_role" ON territories FOR ALL TO service_role
    USING (true) WITH CHECK (true);
    
    RAISE NOTICE '✅ Created policies for territories table';
  END IF;
END $$;

-- Step 6: Create RLS policies for visits (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'visits') THEN
    ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "visits_all_authenticated" ON visits FOR ALL TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "visits_service_role" ON visits FOR ALL TO service_role USING (true) WITH CHECK (true);
    RAISE NOTICE '✅ Created policies for visits table';
  END IF;
END $$;

-- Step 7: Create RLS policies for sales_orders (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sales_orders') THEN
    ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "sales_orders_all_authenticated" ON sales_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "sales_orders_service_role" ON sales_orders FOR ALL TO service_role USING (true) WITH CHECK (true);
    RAISE NOTICE '✅ Created policies for sales_orders table';
  END IF;
END $$;

-- Step 8: Create RLS policies for attendance (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') THEN
    ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "attendance_all_authenticated" ON attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "attendance_service_role" ON attendance FOR ALL TO service_role USING (true) WITH CHECK (true);
    RAISE NOTICE '✅ Created policies for attendance table';
  END IF;
END $$;

-- Step 9: Create RLS policies for sales_targets (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sales_targets') THEN
    ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "sales_targets_all_authenticated" ON sales_targets FOR ALL TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "sales_targets_service_role" ON sales_targets FOR ALL TO service_role USING (true) WITH CHECK (true);
    RAISE NOTICE '✅ Created policies for sales_targets table';
  END IF;
END $$;

-- Step 10: Create RLS policies for sales_achievements (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sales_achievements') THEN
    ALTER TABLE sales_achievements ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "sales_achievements_all_authenticated" ON sales_achievements FOR ALL TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "sales_achievements_service_role" ON sales_achievements FOR ALL TO service_role USING (true) WITH CHECK (true);
    RAISE NOTICE '✅ Created policies for sales_achievements table';
  END IF;
END $$;

-- Step 11: Verify all policies
SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Step 12: Show success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE '✅ All RLS policies have been updated.';
  RAISE NOTICE '✅ Refresh your browser and try again.';
  RAISE NOTICE '========================================';
END $$;
