-- Check if conversions exist for this customer
-- Run this to see if there's data for "Raj Construction"

SELECT 
    c.id,
    c.converted_at,
    c.total_value,
    c.quantity_bags,
    c.product,
    cust.name as customer_name,
    p.full_name as sales_rep,
    p.employee_id
FROM conversions c
JOIN customers cust ON c.customer_id = cust.id
LEFT JOIN profiles p ON c.converted_by = p.id
WHERE cust.name ILIKE '%Raj%'
ORDER BY c.converted_at DESC;

-- Check all recent conversions
SELECT 
    c.id,
    c.converted_at,
    c.total_value,
    c.quantity_bags,
    c.product,
    c.converted_by,
    cust.name as customer_name
FROM conversions c
JOIN customers cust ON c.customer_id = cust.id
WHERE c.converted_at >= NOW() - INTERVAL '30 days'
ORDER BY c.converted_at DESC;

-- Check RLS policies on conversions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'conversions';
