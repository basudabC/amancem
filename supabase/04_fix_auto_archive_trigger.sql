-- ============================================================
-- Quick Fix: Update Auto-Archive Trigger
-- Run this to fix the 'archived' enum error
-- ============================================================

-- The customer_status enum only has: 'active', 'inactive', 'prospect', 'lost'
-- We need to use 'inactive' instead of 'archived'

CREATE OR REPLACE FUNCTION trigger_auto_archive_projects()
RETURNS TRIGGER AS $$
BEGIN
  -- Archive if construction is 100% complete OR cement fully consumed
  -- Use 'inactive' status (not 'archived' - that's not in the enum)
  IF NEW.pipeline = 'one_time' AND NEW.status != 'inactive' THEN
    IF (NEW.construction_stage >= 100) OR 
       (NEW.cement_consumed >= NEW.cement_required AND NEW.cement_required > 0) THEN
      NEW.status := 'inactive';
      RAISE NOTICE 'Project % auto-archived to inactive status (Construction: % percent, Cement: %/%)', 
        NEW.name, NEW.construction_stage, NEW.cement_consumed, NEW.cement_required;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the fix
SELECT 'Auto-archive trigger updated to use inactive status' AS status;
