-- ============================================================
-- VERIFY AND FIX: Check if sales_rep_id column exists
-- ============================================================

-- Step 1: Check if the column was added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'customers'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: If sales_rep_id doesn't exist, add it now
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'sales_rep_id'
        AND table_schema = 'public'
    ) THEN
        -- Add the column
        ALTER TABLE customers ADD COLUMN sales_rep_id UUID REFERENCES profiles(id);
        
        -- Copy data from assigned_to
        UPDATE customers SET sales_rep_id = assigned_to;
        
        RAISE NOTICE '✅ Added sales_rep_id column and copied data';
    ELSE
        RAISE NOTICE 'ℹ️ sales_rep_id column already exists';
    END IF;
END $$;

-- Step 3: Verify data was copied
SELECT 
    COUNT(*) as total_customers,
    COUNT(assigned_to) as customers_with_assigned_to,
    COUNT(sales_rep_id) as customers_with_sales_rep_id
FROM customers;

-- Step 4: Show sample data
SELECT 
    id,
    name,
    assigned_to,
    sales_rep_id,
    status
FROM customers
LIMIT 5;

-- Step 5: Test the exact query the app is making
-- This simulates what the app does
SELECT 
    c.*,
    t.name as territory_name,
    t.color_key,
    p.full_name as sales_rep_name
FROM customers c
LEFT JOIN territories t ON c.territory_id = t.id
LEFT JOIN profiles p ON c.sales_rep_id = p.id
WHERE c.status = 'active'
LIMIT 5;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'If you see data above, the column exists!';
    RAISE NOTICE 'If the test query worked, refresh browser';
    RAISE NOTICE '========================================';
END $$;
