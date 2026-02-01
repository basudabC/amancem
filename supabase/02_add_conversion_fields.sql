-- ============================================================
-- Phase 2: Add Missing Fields to Conversions Table
-- Complete sales recording as per workflow requirements
-- ============================================================

-- Step 1: Add visit reference and sale ID
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS visit_id UUID REFERENCES visits(id);
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS sale_id VARCHAR(50) UNIQUE;

-- Step 2: Product details (what was sold)
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS product VARCHAR(50); -- 'AmanCem Advance', 'AmanCem Basic', etc.
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS quantity_bags INTEGER; -- Number of bags sold
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS unit_price DECIMAL(8,2); -- Price per bag in Tk
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS total_value DECIMAL(12,2); -- Auto-calculated: quantity × unit_price

-- Step 3: Payment details
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20); -- 'cash', 'credit', 'partial'
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS cash_amount DECIMAL(12,2);
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS credit_amount DECIMAL(12,2);
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS credit_days INTEGER;
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS expected_payment_date DATE;

-- Step 4: Delivery details
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,8);
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(11,8);
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'pending'; -- 'pending', 'dispatched', 'delivered'
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS actual_delivery_date DATE;

-- Step 5: Project-specific updates
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS construction_stage_update DECIMAL(5,2); -- Updated construction % for projects
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS cement_consumed_update DECIMAL(10,2); -- Updated cement consumed for projects

-- Step 6: Additional notes
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS sale_notes TEXT;

-- Step 7: Update existing records with defaults
-- Set product from product_type if available
UPDATE conversions 
SET product = product_type 
WHERE product IS NULL AND product_type IS NOT NULL;

-- Set quantity from order_volume if available
UPDATE conversions 
SET quantity_bags = order_volume::INTEGER 
WHERE quantity_bags IS NULL AND order_volume IS NOT NULL;

-- Set total_value from order_value if available
UPDATE conversions 
SET total_value = order_value 
WHERE total_value IS NULL AND order_value IS NOT NULL;

-- Set default payment type to cash for existing records
UPDATE conversions 
SET payment_type = 'cash',
    cash_amount = total_value
WHERE payment_type IS NULL AND total_value IS NOT NULL;

-- Step 8: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversions_visit ON conversions(visit_id);
CREATE INDEX IF NOT EXISTS idx_conversions_customer ON conversions(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversions_converted_by ON conversions(converted_by);
CREATE INDEX IF NOT EXISTS idx_conversions_sale_id ON conversions(sale_id);
CREATE INDEX IF NOT EXISTS idx_conversions_delivery_status ON conversions(delivery_status);
CREATE INDEX IF NOT EXISTS idx_conversions_payment_type ON conversions(payment_type);

-- Step 9: Add comments for documentation
COMMENT ON COLUMN conversions.sale_id IS 'Unique sale identifier (e.g., ACM-2025-00847)';
COMMENT ON COLUMN conversions.product IS 'Aman Cement product name';
COMMENT ON COLUMN conversions.quantity_bags IS 'Number of cement bags sold';
COMMENT ON COLUMN conversions.unit_price IS 'Price per bag in Taka';
COMMENT ON COLUMN conversions.total_value IS 'Total sale value (quantity × unit_price)';
COMMENT ON COLUMN conversions.payment_type IS 'cash, credit, or partial payment';
COMMENT ON COLUMN conversions.delivery_status IS 'pending, dispatched, or delivered';

-- ============================================================
-- Success message
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'Conversions table schema updated successfully!';
  RAISE NOTICE 'Added fields for: product details, payment info, delivery tracking, project updates';
END $$;
