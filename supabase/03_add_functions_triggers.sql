-- ============================================================
-- Phase 3: Database Functions and Triggers
-- Business logic automation for workflow requirements
-- ============================================================

-- ============================================================
-- Function 1: GPS Check-in Validation
-- Validates that rep is within 200m of customer and not moving too fast
-- ============================================================

CREATE OR REPLACE FUNCTION validate_gps_checkin(
  p_customer_lat DECIMAL,
  p_customer_lng DECIMAL,
  p_checkin_lat DECIMAL,
  p_checkin_lng DECIMAL,
  p_speed DECIMAL DEFAULT 0
)
RETURNS TABLE(is_valid BOOLEAN, distance_meters DECIMAL, reason TEXT) AS $$
DECLARE
  v_distance DECIMAL;
  v_max_distance CONSTANT DECIMAL := 200; -- 200 meters as per workflow
  v_max_speed CONSTANT DECIMAL := 60; -- 60 km/h as per workflow
BEGIN
  -- Handle NULL coordinates
  IF p_customer_lat IS NULL OR p_customer_lng IS NULL OR 
     p_checkin_lat IS NULL OR p_checkin_lng IS NULL THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Missing GPS coordinates';
    RETURN;
  END IF;
  
  -- Calculate distance using Haversine formula
  -- Result in meters
  v_distance := (
    6371000 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(p_customer_lat)) * 
        cos(radians(p_checkin_lat)) * 
        cos(radians(p_checkin_lng) - radians(p_customer_lng)) + 
        sin(radians(p_customer_lat)) * 
        sin(radians(p_checkin_lat))
      ))
    )
  );
  
  -- Check speed (anti-fake detection)
  IF p_speed > v_max_speed THEN
    RETURN QUERY SELECT 
      false, 
      v_distance, 
      'Speed too high: ' || ROUND(p_speed, 1) || ' km/h. Maximum allowed: ' || v_max_speed || ' km/h';
    RETURN;
  END IF;
  
  -- Check distance from customer
  IF v_distance > v_max_distance THEN
    RETURN QUERY SELECT 
      false, 
      v_distance, 
      'Too far from customer: ' || ROUND(v_distance, 0) || 'm away. Maximum allowed: ' || v_max_distance || 'm';
    RETURN;
  END IF;
  
  -- Valid check-in
  RETURN QUERY SELECT true, v_distance, 'Valid check-in within ' || ROUND(v_distance, 0) || 'm';
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION validate_gps_checkin IS 'Validates GPS check-in is within 200m and speed is under 60 km/h';

-- ============================================================
-- Function 2: Calculate Cement Requirement for Projects
-- Auto-calculates based on area, floors, and structure type
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_cement_requirement(
  p_built_up_area DECIMAL,
  p_floors INTEGER,
  p_structure_type VARCHAR
)
RETURNS DECIMAL AS $$
DECLARE
  v_cement_tons DECIMAL;
  v_wastage_factor CONSTANT DECIMAL := 1.10; -- 10% wastage buffer
BEGIN
  -- Handle NULL or invalid inputs
  IF p_built_up_area IS NULL OR p_built_up_area <= 0 THEN
    RETURN 0;
  END IF;
  
  IF p_floors IS NULL OR p_floors <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Calculate based on structure type (formulas from workflow)
  CASE UPPER(p_structure_type)
    WHEN 'RCC' THEN
      -- RCC: area × (0.25 + (floors-1) × 0.18)
      v_cement_tons := p_built_up_area * (0.25 + (p_floors - 1) * 0.18);
    WHEN 'STEEL' THEN
      -- Steel: area × 0.15 × floors
      v_cement_tons := p_built_up_area * 0.15 * p_floors;
    WHEN 'MIXED' THEN
      -- Mixed: area × 0.20 × floors
      v_cement_tons := p_built_up_area * 0.20 * p_floors;
    ELSE
      -- Default to RCC if unknown
      v_cement_tons := p_built_up_area * (0.25 + (p_floors - 1) * 0.18);
  END CASE;
  
  -- Apply wastage factor and round to 2 decimal places
  RETURN ROUND(v_cement_tons * v_wastage_factor, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_cement_requirement IS 'Auto-calculates cement requirement for projects with 10% wastage buffer';

-- ============================================================
-- Function 3: Generate Unique Sale ID
-- Format: ACM-YYYY-XXXXX
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS sale_id_seq START 1;

CREATE OR REPLACE FUNCTION generate_sale_id()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_sequence TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_sequence := LPAD(NEXTVAL('sale_id_seq')::TEXT, 5, '0');
  RETURN 'ACM-' || v_year || '-' || v_sequence;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_sale_id IS 'Generates unique sale ID in format ACM-YYYY-XXXXX';

-- ============================================================
-- Trigger 1: Auto-Update Cement Requirement for Projects
-- Runs when project details change
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_update_cement_requirement()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for project customers (one_time pipeline)
  IF NEW.pipeline = 'one_time' AND 
     NEW.built_up_area IS NOT NULL AND 
     NEW.number_of_floors IS NOT NULL AND
     NEW.structure_type IS NOT NULL THEN
    
    -- Calculate cement required
    NEW.cement_required := calculate_cement_requirement(
      NEW.built_up_area,
      NEW.number_of_floors,
      NEW.structure_type
    );
    
    -- Calculate cement remaining
    NEW.cement_remaining := NEW.cement_required - COALESCE(NEW.cement_consumed, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cement_requirement ON customers;
CREATE TRIGGER trigger_update_cement_requirement
  BEFORE INSERT OR UPDATE OF built_up_area, number_of_floors, structure_type, cement_consumed
  ON customers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_cement_requirement();

COMMENT ON FUNCTION trigger_update_cement_requirement IS 'Auto-calculates cement requirement when project details change';

-- ============================================================
-- Trigger 2: Auto-Generate Sale ID for Conversions
-- Runs when new sale is created
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_generate_sale_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sale_id IS NULL THEN
    NEW.sale_id := generate_sale_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_sale_id ON conversions;
CREATE TRIGGER trigger_generate_sale_id
  BEFORE INSERT ON conversions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_sale_id();

COMMENT ON FUNCTION trigger_generate_sale_id IS 'Auto-generates unique sale ID for new conversions';

-- ============================================================
-- Trigger 3: Auto-Calculate Expected Payment Date
-- Runs when credit days are set
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_calculate_payment_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.credit_days IS NOT NULL AND NEW.credit_days > 0 THEN
    NEW.expected_payment_date := CURRENT_DATE + (NEW.credit_days || ' days')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_payment_date ON conversions;
CREATE TRIGGER trigger_calculate_payment_date
  BEFORE INSERT OR UPDATE OF credit_days
  ON conversions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_payment_date();

COMMENT ON FUNCTION trigger_calculate_payment_date IS 'Auto-calculates expected payment date based on credit days';

-- ============================================================
-- Trigger 4: Update Customer Cement Consumed from Sales
-- Runs when sale records cement consumption update
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_update_customer_cement()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer's cement consumed when a sale is recorded for a project
  IF NEW.cement_consumed_update IS NOT NULL THEN
    UPDATE customers
    SET cement_consumed = NEW.cement_consumed_update,
        cement_remaining = GREATEST(0, cement_required - NEW.cement_consumed_update),
        construction_stage = COALESCE(NEW.construction_stage_update, construction_stage)
    WHERE id = NEW.customer_id AND pipeline = 'one_time';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_cement ON conversions;
CREATE TRIGGER trigger_update_customer_cement
  AFTER INSERT OR UPDATE OF cement_consumed_update, construction_stage_update
  ON conversions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_customer_cement();

COMMENT ON FUNCTION trigger_update_customer_cement IS 'Updates customer cement consumed and construction stage from sales';

-- ============================================================
-- Trigger 5: Auto-Archive Completed Projects
-- Runs when project reaches 100% or cement fully consumed
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_auto_archive_projects()
RETURNS TRIGGER AS $$
BEGIN
  -- Archive if construction is 100% complete OR cement fully consumed
  IF NEW.pipeline = 'one_time' AND NEW.status != 'inactive' THEN
    IF (NEW.construction_stage >= 100) OR 
       (NEW.cement_consumed >= NEW.cement_required AND NEW.cement_required > 0) THEN
      NEW.status := 'inactive';
      -- Use format() to properly handle the percentage sign
      RAISE NOTICE 'Project % auto-archived (Construction: % percent, Cement: %/%)', 
        NEW.name, NEW.construction_stage, NEW.cement_consumed, NEW.cement_required;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_archive_projects ON customers;
CREATE TRIGGER trigger_auto_archive_projects
  BEFORE UPDATE OF construction_stage, cement_consumed
  ON customers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_archive_projects();

COMMENT ON FUNCTION trigger_auto_archive_projects IS 'Auto-archives projects when 100% complete or cement fully consumed';

-- ============================================================
-- Trigger 6: Auto-Calculate Total Value in Conversions
-- Runs when quantity or unit price changes
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_calculate_total_value()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity_bags IS NOT NULL AND NEW.unit_price IS NOT NULL THEN
    NEW.total_value := NEW.quantity_bags * NEW.unit_price;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_total_value ON conversions;
CREATE TRIGGER trigger_calculate_total_value
  BEFORE INSERT OR UPDATE OF quantity_bags, unit_price
  ON conversions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_total_value();

COMMENT ON FUNCTION trigger_calculate_total_value IS 'Auto-calculates total sale value (quantity × unit price)';

-- ============================================================
-- Success message
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database functions and triggers created successfully!';
  RAISE NOTICE '   - GPS validation function (200m radius, 60 km/h speed check)';
  RAISE NOTICE '   - Cement requirement calculation (RCC/Steel/Mixed formulas)';
  RAISE NOTICE '   - Sale ID auto-generation (ACM-YYYY-XXXXX)';
  RAISE NOTICE '   - Auto-calculate cement remaining';
  RAISE NOTICE '   - Auto-calculate payment dates';
  RAISE NOTICE '   - Auto-archive completed projects';
  RAISE NOTICE '   - Auto-calculate total sale value';
END $$;
