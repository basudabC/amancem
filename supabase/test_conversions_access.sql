-- Test if conversions data exists and is accessible
-- Run this as the logged-in user to see what they can access

-- 1. Check total conversions in database (as admin/service role)
SELECT 
    COUNT(*) as total_conversions,
    SUM(total_value) as total_value,
    SUM(quantity_bags) as total_bags
FROM conversions;

-- 2. Check conversions with customer details
SELECT 
    c.id,
    c.customer_id,
    c.converted_by,
    c.converted_at,
    c.total_value,
    c.quantity_bags,
    c.product,
    cust.name as customer_name,
    p.full_name as sales_rep_name,
    p.employee_id
FROM conversions c
LEFT JOIN customers cust ON c.customer_id = cust.id
LEFT JOIN profiles p ON c.converted_by = p.id
ORDER BY c.converted_at DESC
LIMIT 10;

-- 3. Check for the specific customer "Raj Construction"
SELECT 
    c.*,
    cust.name as customer_name
FROM conversions c
JOIN customers cust ON c.customer_id = cust.id
WHERE cust.name ILIKE '%Raj%'
ORDER BY c.converted_at DESC;

-- 4. Check current RLS policies
SELECT 
    tablename,
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies
WHERE tablename = 'conversions'
ORDER BY cmd, policyname;

-- 5. Test what current user can see (run this as authenticated user)
-- This simulates what the app sees
SELECT 
    c.id,
    c.customer_id,
    c.total_value,
    c.quantity_bags,
    c.product,
    c.converted_at
FROM conversions c
WHERE c.customer_id = '2f0558db-725f-434a-a104-085dd30ca2df' -- Raj Construction ID
AND c.converted_at >= NOW() - INTERVAL '30 days'
ORDER BY c.converted_at DESC;
