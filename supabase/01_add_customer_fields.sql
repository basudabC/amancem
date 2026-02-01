-- ============================================================
-- Phase 1: Add Missing Fields to Customers Table
-- Fix for constraint error - add fields first, then validate
-- ============================================================

-- Step 1: Add all missing columns to customers table
-- (These can be added safely without constraints)

-- Owner information
ALTER TABLE customers ADD COLUMN IF NOT EXISTS owner_name VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS owner_age INTEGER;

-- Recurring shop - Monthly sales by product (in tons)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS monthly_sales_advance DECIMAL(10,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS monthly_sales_advance_plus DECIMAL(10,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS monthly_sales_green DECIMAL(10,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS monthly_sales_basic DECIMAL(10,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS monthly_sales_classic DECIMAL(10,2);

-- Recurring shop - Selling prices (per bag in Tk)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS selling_price_advance DECIMAL(8,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS selling_price_advance_plus DECIMAL(8,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS selling_price_green DECIMAL(8,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS selling_price_basic DECIMAL(8,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS selling_price_classic DECIMAL(8,2);

-- Recurring shop - Brand and competitor data
ALTER TABLE customers ADD COLUMN IF NOT EXISTS brand_preferences TEXT[]; -- Ordered array of preferred brands
ALTER TABLE customers ADD COLUMN IF NOT EXISTS competitor_brands TEXT[]; -- List of competitor brands sold

-- Recurring shop - Storage and credit
ALTER TABLE customers ADD COLUMN IF NOT EXISTS storage_capacity DECIMAL(10,2); -- in tons
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_practice VARCHAR(20); -- 'cash' or 'credit'
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_days INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS promotions_offered TEXT[];

-- Project customer - Construction details
ALTER TABLE customers ADD COLUMN IF NOT EXISTS built_up_area DECIMAL(10,2); -- sqft
ALTER TABLE customers ADD COLUMN IF NOT EXISTS number_of_floors INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS structure_type VARCHAR(20); -- 'RCC', 'Steel', 'Mixed'
ALTER TABLE customers ADD COLUMN IF NOT EXISTS construction_stage DECIMAL(5,2); -- percentage (0-100)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS project_started BOOLEAN;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS current_brand VARCHAR(50);

-- Project customer - Auto-calculated cement requirement
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cement_required DECIMAL(10,2); -- tons (auto-calculated)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cement_consumed DECIMAL(10,2) DEFAULT 0; -- tons (updated on each sale)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cement_remaining DECIMAL(10,2); -- tons (auto-calculated)

-- Step 2: Update existing data to satisfy future constraints
-- Set shop_name for recurring customers if not already set
UPDATE customers 
SET shop_name = name 
WHERE pipeline = 'recurring' AND shop_name IS NULL;

-- Set built_up_area to a default for project customers if not set
-- (This is temporary - real data should be entered via UI)
UPDATE customers 
SET built_up_area = 1000,
    number_of_floors = 1,
    structure_type = 'RCC'
WHERE pipeline = 'one_time' AND built_up_area IS NULL;

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_pipeline ON customers(pipeline);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_territory ON customers(territory_id);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers(assigned_to);

-- Step 4: Add comments for documentation
COMMENT ON COLUMN customers.owner_name IS 'Owner name for shops/projects';
COMMENT ON COLUMN customers.owner_age IS 'Owner age (for recurring shops)';
COMMENT ON COLUMN customers.brand_preferences IS 'Ordered array of brand preferences (1st = most preferred)';
COMMENT ON COLUMN customers.competitor_brands IS 'List of competitor brands the customer sells';
COMMENT ON COLUMN customers.cement_required IS 'Auto-calculated total cement needed for project';
COMMENT ON COLUMN customers.cement_consumed IS 'Running total of cement consumed in project';
COMMENT ON COLUMN customers.cement_remaining IS 'Auto-calculated remaining cement needed';

-- ============================================================
-- Success message
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'Customer table schema updated successfully!';
  RAISE NOTICE 'Added fields for: owner info, sales data, brand preferences, construction details, cement tracking';
END $$;
