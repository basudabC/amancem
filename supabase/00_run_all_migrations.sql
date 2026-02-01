-- ============================================================
-- MASTER MIGRATION SCRIPT
-- Run this to apply all critical workflow fixes
-- ============================================================

-- This script combines all migrations in the correct order
-- Run in Supabase SQL Editor

-- ============================================================
-- STEP 1: Add missing fields to customers table
-- ============================================================
\i 01_add_customer_fields.sql

-- ============================================================
-- STEP 2: Add missing fields to conversions table
-- ============================================================
\i 02_add_conversion_fields.sql

-- ============================================================
-- STEP 3: Add functions and triggers
-- ============================================================
\i 03_add_functions_triggers.sql

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check customer table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- Check conversions table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversions'
ORDER BY ordinal_position;

-- Check functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'validate_gps_checkin',
  'calculate_cement_requirement',
  'generate_sale_id'
)
ORDER BY routine_name;

-- Check triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_%'
ORDER BY event_object_table, trigger_name;

-- ============================================================
-- TEST QUERIES
-- ============================================================

-- Test GPS validation
SELECT * FROM validate_gps_checkin(
  23.8715,  -- customer lat
  90.3985,  -- customer lng
  23.8720,  -- checkin lat (slightly different)
  90.3990,  -- checkin lng (slightly different)
  15        -- speed in km/h
);

-- Test cement calculation
SELECT calculate_cement_requirement(
  1200,  -- sqft
  3,     -- floors
  'RCC'  -- structure type
) AS cement_required_tons;

-- Test sale ID generation
SELECT generate_sale_id() AS sample_sale_id;

-- ============================================================
-- Success message
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Database is now ready for:';
  RAISE NOTICE '  ✓ Complete customer data (shops + projects)';
  RAISE NOTICE '  ✓ Complete sales recording';
  RAISE NOTICE '  ✓ GPS validation (200m + speed check)';
  RAISE NOTICE '  ✓ Auto-calculated cement requirements';
  RAISE NOTICE '  ✓ Auto-generated sale IDs';
  RAISE NOTICE '  ✓ Auto-archived completed projects';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Update TypeScript types';
  RAISE NOTICE '  2. Update frontend forms';
  RAISE NOTICE '  3. Test workflows end-to-end';
END $$;
