-- ============================================================
-- FIX: Add sales_rep_id column to customers table
-- ============================================================
-- The app code expects 'sales_rep_id' but the schema uses 'assigned_to'
-- This adds the sales_rep_id column and syncs it with assigned_to
-- ============================================================

-- Step 1: Add the sales_rep_id column
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS sales_rep_id UUID REFERENCES profiles(id);

-- Step 2: Copy existing data from assigned_to to sales_rep_id
UPDATE customers 
SET sales_rep_id = assigned_to 
WHERE sales_rep_id IS NULL;

-- Step 3: Create a trigger to keep both columns in sync
-- This ensures that when assigned_to is updated, sales_rep_id is also updated
CREATE OR REPLACE FUNCTION sync_sales_rep_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.sales_rep_id := NEW.assigned_to;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS sync_sales_rep_id_trigger ON customers;

-- Create the trigger
CREATE TRIGGER sync_sales_rep_id_trigger
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION sync_sales_rep_id();

-- Step 4: Verify the fix
SELECT 
  id,
  name,
  assigned_to,
  sales_rep_id,
  status,
  created_at
FROM customers
LIMIT 10;

-- Step 5: Check if there are any customers
SELECT COUNT(*) as total_customers FROM customers;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ sales_rep_id column added successfully!';
  RAISE NOTICE '✅ Data synced from assigned_to column';
  RAISE NOTICE '✅ Trigger created to keep columns in sync';
  RAISE NOTICE '✅ Refresh your browser now!';
  RAISE NOTICE '========================================';
END $$;
