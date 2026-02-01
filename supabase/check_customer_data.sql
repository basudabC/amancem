-- Check if customer data is being saved correctly
-- Run this to see what's actually in the database

SELECT 
    id,
    name,
    owner_name,
    phone,
    pipeline,
    -- Monthly sales fields
    monthly_sales_advance,
    monthly_sales_advance_plus,
    monthly_sales_green,
    monthly_sales_basic,
    monthly_sales_classic,
    -- Calculated total
    (COALESCE(monthly_sales_advance, 0) + 
     COALESCE(monthly_sales_advance_plus, 0) + 
     COALESCE(monthly_sales_green, 0) + 
     COALESCE(monthly_sales_basic, 0) + 
     COALESCE(monthly_sales_classic, 0)) as total_monthly_volume,
    created_at
FROM customers
WHERE pipeline = 'recurring'
ORDER BY created_at DESC
LIMIT 5;

-- Also check the exact customer you just added
SELECT 
    name,
    monthly_sales_advance,
    monthly_sales_advance_plus,
    monthly_sales_green,
    monthly_sales_basic,
    monthly_sales_classic
FROM customers
WHERE name = 'Raj Construction'
ORDER BY created_at DESC
LIMIT 1;
