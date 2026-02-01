-- EMERGENCY FIX - Temporarily disable RLS to test
-- This will help us confirm if RLS is the issue

-- Disable RLS temporarily
ALTER TABLE conversions DISABLE ROW LEVEL SECURITY;

-- Test if you can now see conversions
SELECT 
    COUNT(*) as total_conversions,
    SUM(total_value) as total_value,
    SUM(quantity_bags) as total_bags
FROM conversions;

-- Show all conversions
SELECT 
    id,
    customer_id,
    total_value,
    quantity_bags,
    product,
    converted_at
FROM conversions
ORDER BY converted_at DESC
LIMIT 5;
