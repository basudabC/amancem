-- ============================================================
-- FIX: Add color_key column to territories table
-- ============================================================
-- The app expects 'color_key' but schema uses 'color'
-- This adds the color_key column and syncs it
-- ============================================================

-- Step 1: Check current columns in territories table
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'territories'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add color_key as an alias to color
ALTER TABLE territories 
ADD COLUMN IF NOT EXISTS color_key territory_color;

-- Step 3: Copy existing data from color to color_key
UPDATE territories 
SET color_key = color 
WHERE color_key IS NULL;

-- Step 4: Create trigger to keep both columns in sync
CREATE OR REPLACE FUNCTION sync_territory_color_key()
RETURNS TRIGGER AS $$
BEGIN
  NEW.color_key := NEW.color;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_territory_color_key_trigger ON territories;

CREATE TRIGGER sync_territory_color_key_trigger
  BEFORE INSERT OR UPDATE ON territories
  FOR EACH ROW
  EXECUTE FUNCTION sync_territory_color_key();

-- Step 5: Also add sales_rep_id to customers if not done
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS sales_rep_id UUID REFERENCES profiles(id);

UPDATE customers 
SET sales_rep_id = assigned_to 
WHERE sales_rep_id IS NULL;

-- Step 6: Verify both fixes
SELECT 
    COUNT(*) as total_territories,
    COUNT(color) as territories_with_color,
    COUNT(color_key) as territories_with_color_key
FROM territories;

SELECT 
    COUNT(*) as total_customers,
    COUNT(assigned_to) as customers_with_assigned_to,
    COUNT(sales_rep_id) as customers_with_sales_rep_id
FROM customers;

-- Step 7: Test the full query the app is making
SELECT 
    c.id,
    c.name,
    c.status,
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
  RAISE NOTICE '✅ color_key column added to territories!';
  RAISE NOTICE '✅ sales_rep_id column added to customers!';
  RAISE NOTICE '✅ Both columns synced with data';
  RAISE NOTICE '✅ Triggers created to keep columns in sync';
  RAISE NOTICE '✅ Refresh your browser now!';
  RAISE NOTICE '========================================';
END $$;
