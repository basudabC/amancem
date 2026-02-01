-- ============================================================
-- SIMPLE DIAGNOSTIC: Check what columns actually exist
-- ============================================================

-- Check customers table columns
SELECT 'CUSTOMERS TABLE COLUMNS:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'customers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check territories table columns
SELECT 'TERRITORIES TABLE COLUMNS:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'territories' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check profiles table columns
SELECT 'PROFILES TABLE COLUMNS:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Count records
SELECT 'RECORD COUNTS:' as info;
SELECT 
    (SELECT COUNT(*) FROM customers) as customers_count,
    (SELECT COUNT(*) FROM territories) as territories_count,
    (SELECT COUNT(*) FROM profiles) as profiles_count;

-- Try a simple query
SELECT 'SIMPLE CUSTOMER QUERY:' as info;
SELECT id, name, status FROM customers LIMIT 3;

-- Try the problematic join
SELECT 'TESTING JOIN QUERY:' as info;
SELECT 
    c.id,
    c.name,
    c.status,
    c.pipeline
FROM customers c
WHERE c.status = 'active'
LIMIT 3;
