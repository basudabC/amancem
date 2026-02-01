-- ============================================================
-- Check and fix customers table foreign key relationship
-- ============================================================

-- 1. Check if the foreign key exists
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='customers'
  AND kcu.column_name='sales_rep_id';

-- 2. If the foreign key doesn't exist, create it
-- First, drop if exists to avoid conflicts
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_sales_rep_id_fkey;

-- Create the foreign key relationship
ALTER TABLE customers
ADD CONSTRAINT customers_sales_rep_id_fkey
FOREIGN KEY (sales_rep_id)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- 3. Verify the relationship was created
SELECT
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='customers'
  AND kcu.column_name='sales_rep_id';
