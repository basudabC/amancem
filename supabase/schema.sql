-- =============================================================================
-- AMAN CEMENT CRM - SUPABASE DATABASE SCHEMA
-- Complete SQL script with tables, relationships, RLS policies, and triggers
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE user_role AS ENUM (
  'sales_rep',
  'supervisor', 
  'area_manager',
  'regional_manager',
  'country_head'
);

CREATE TYPE customer_pipeline AS ENUM ('recurring', 'one_time');
CREATE TYPE customer_status AS ENUM (
  'active', 
  'inactive', 
  'prospect', 
  'lost'
);

CREATE TYPE visit_outcome AS ENUM (
  'interested',
  'progressive', 
  'not_interested',
  'stagnant',
  'new'
);

CREATE TYPE visit_status AS ENUM (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'on_leave',
  'on_duty'
);

CREATE TYPE territory_color AS ENUM (
  'territory_a',
  'territory_b', 
  'territory_c',
  'territory_d',
  'territory_e',
  'territory_f',
  'territory_g',
  'territory_h'
);

-- =============================================================================
-- PROFILES TABLE (extends auth.users)
-- =============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_code VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'sales_rep',
  avatar_url TEXT,
  reports_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  territory_ids UUID[] DEFAULT '{}',
  region VARCHAR(50),
  area VARCHAR(50),
  target_monthly DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_reporting CHECK (id != reports_to)
);

-- Index for hierarchy queries
CREATE INDEX idx_profiles_reports_to ON profiles(reports_to);

COMMENT ON TABLE profiles IS 'Extended user profiles for all employees';
COMMENT ON COLUMN profiles.territory_ids IS 'Array of territory IDs this user can access';
COMMENT ON COLUMN profiles.reports_to IS 'Manager this user reports to in the organizational hierarchy';

-- =============================================================================
-- TERRITORIES TABLE
-- =============================================================================

CREATE TABLE territories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  color territory_color NOT NULL DEFAULT 'territory_a',
  region VARCHAR(50) NOT NULL,
  area VARCHAR(50),
  supervisor_id UUID REFERENCES profiles(id),
  geojson JSONB NOT NULL, -- GeoJSON Polygon/MultiPolygon
  center_lat DECIMAL(10, 8) NOT NULL,
  center_lng DECIMAL(11, 8) NOT NULL,
  zoom_level INTEGER DEFAULT 12,
  target_monthly DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE territories IS 'Geographic territories with polygon boundaries';
COMMENT ON COLUMN territories.geojson IS 'GeoJSON format polygon coordinates';

-- =============================================================================
-- CUSTOMERS TABLE
-- =============================================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  territory_id UUID REFERENCES territories(id),
  
  -- Pipeline classification
  pipeline customer_pipeline NOT NULL DEFAULT 'recurring',
  status customer_status NOT NULL DEFAULT 'prospect',
  
  -- For recurring customers
  shop_name VARCHAR(100),
  monthly_volume DECIMAL(10,2),
  
  -- For project customers
  project_type VARCHAR(50),
  project_value DECIMAL(12,2),
  expected_start_date DATE,
  expected_end_date DATE,
  
  -- Assignment
  assigned_to UUID REFERENCES profiles(id),
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ,
  
  -- Visit tracking
  last_visit_at TIMESTAMPTZ,
  last_visit_outcome visit_outcome,
  next_scheduled_visit TIMESTAMPTZ,
  visit_count INTEGER DEFAULT 0,
  
  -- Conversion tracking
  is_converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  converted_by UUID REFERENCES profiles(id),
  
  -- Metadata
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE customers IS 'Customer master data with pipeline classification';
COMMENT ON COLUMN customers.pipeline IS 'recurring=retailers/dealers, one_time=construction projects';

-- =============================================================================
-- VISITS TABLE
-- =============================================================================

CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sales_rep_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Visit scheduling
  scheduled_at TIMESTAMPTZ,
  scheduled_duration INTEGER, -- in minutes
  
  -- Check-in details
  checked_in_at TIMESTAMPTZ,
  check_in_lat DECIMAL(10, 8),
  check_in_lng DECIMAL(11, 8),
  check_in_accuracy DECIMAL(8, 2), -- GPS accuracy in meters
  check_in_speed DECIMAL(5, 2), -- Speed in km/h for anti-fake detection
  
  -- Check-out details
  checked_out_at TIMESTAMPTZ,
  check_out_lat DECIMAL(10, 8),
  check_out_lng DECIMAL(11, 8),
  
  -- Visit outcomes
  status visit_status NOT NULL DEFAULT 'scheduled',
  outcome visit_outcome,
  
  -- Visit content
  purpose TEXT,
  notes TEXT,
  feedback TEXT,
  
  -- Product interest
  products_discussed TEXT[] DEFAULT '{}',
  estimated_requirement DECIMAL(10,2), -- in bags
  expected_order_date DATE,
  
  -- Photos
  photos TEXT[] DEFAULT '{}',
  
  -- GPS validation
  distance_from_customer DECIMAL(8, 2), -- Distance in meters
  is_within_geofence BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE visits IS 'Visit tracking with GPS validation and outcomes';
COMMENT ON COLUMN visits.check_in_speed IS 'Used for anti-fake GPS detection';
COMMENT ON COLUMN visits.distance_from_customer IS 'Distance from customer location in meters';

-- =============================================================================
-- ROUTE PLANS TABLE
-- =============================================================================

CREATE TABLE route_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_rep_id UUID NOT NULL REFERENCES profiles(id),
  date DATE NOT NULL,
  
  -- Route details
  name VARCHAR(100),
  start_location_lat DECIMAL(10, 8),
  start_location_lng DECIMAL(11, 8),
  end_location_lat DECIMAL(10, 8),
  end_location_lng DECIMAL(11, 8),
  
  -- Planned customers (ordered)
  planned_customers UUID[] DEFAULT '{}',
  planned_order INTEGER[] DEFAULT '{}', -- Order of visits
  
  -- Status
  is_executed BOOLEAN DEFAULT false,
  execution_started_at TIMESTAMPTZ,
  execution_completed_at TIMESTAMPTZ,
  
  -- Metrics
  total_planned_visits INTEGER DEFAULT 0,
  total_completed_visits INTEGER DEFAULT 0,
  total_distance_km DECIMAL(8,2),
  estimated_duration_minutes INTEGER,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(sales_rep_id, date)
);

COMMENT ON TABLE route_plans IS 'Daily route planning for sales representatives';

-- =============================================================================
-- ATTENDANCE TABLE
-- =============================================================================

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  date DATE NOT NULL,
  
  -- Check-in
  check_in_at TIMESTAMPTZ,
  check_in_lat DECIMAL(10, 8),
  check_in_lng DECIMAL(11, 8),
  check_in_photo TEXT,
  check_in_notes TEXT,
  
  -- Check-out
  check_out_at TIMESTAMPTZ,
  check_out_lat DECIMAL(10, 8),
  check_out_lng DECIMAL(11, 8),
  check_out_photo TEXT,
  check_out_notes TEXT,
  
  -- Status
  status attendance_status NOT NULL DEFAULT 'absent',
  
  -- Work hours
  total_hours DECIMAL(4,2),
  
  -- Location tracking
  location_pings_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

COMMENT ON TABLE attendance IS 'Daily attendance tracking with location';

-- =============================================================================
-- LOCATION PINGS TABLE (for continuous tracking)
-- =============================================================================

CREATE TABLE location_pings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  attendance_id UUID REFERENCES attendance(id),
  
  -- Location
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2),
  speed DECIMAL(5, 2),
  heading DECIMAL(5, 2),
  
  -- Context
  battery_level INTEGER,
  is_moving BOOLEAN DEFAULT false,
  activity_type VARCHAR(20), -- walking, driving, stationary
  
  -- Timestamp
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX idx_location_pings_user_time ON location_pings(user_id, recorded_at);
CREATE INDEX idx_location_pings_recorded_at ON location_pings(recorded_at);

COMMENT ON TABLE location_pings IS 'Continuous location tracking for field staff';

-- =============================================================================
-- CONVERSIONS TABLE (for tracking customer conversions)
-- =============================================================================

CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  converted_by UUID NOT NULL REFERENCES profiles(id),
  converted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Conversion details
  order_value DECIMAL(12,2),
  order_volume DECIMAL(10,2), -- in bags
  product_type VARCHAR(50),
  
  -- Source tracking
  source_visit_id UUID REFERENCES visits(id),
  days_from_first_contact INTEGER,
  total_visits_before_conversion INTEGER,
  
  -- Approval (for supervisors)
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE conversions IS 'Track customer conversions and their sources';

-- =============================================================================
-- PRODUCTS TABLE (for cement products catalog)
-- =============================================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50),
  
  -- Pricing
  price_per_bag DECIMAL(8,2),
  min_order_quantity INTEGER DEFAULT 50,
  
  -- Specifications
  strength_grade VARCHAR(10),
  bag_weight_kg DECIMAL(4,1) DEFAULT 50,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE products IS 'Cement products catalog';

-- =============================================================================
-- DASHBOARD STATS TABLE (cached metrics)
-- =============================================================================

CREATE TABLE dashboard_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  territory_id UUID REFERENCES territories(id),
  
  -- Period
  period_type VARCHAR(10) NOT NULL, -- daily, weekly, monthly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Metrics
  total_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  converted_customers INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  completed_visits INTEGER DEFAULT 0,
  target_visits INTEGER DEFAULT 0,
  total_orders DECIMAL(12,2) DEFAULT 0,
  target_orders DECIMAL(12,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Calculated at
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, territory_id, period_type, period_start)
);

COMMENT ON TABLE dashboard_stats IS 'Cached dashboard metrics for performance';

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Content
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) NOT NULL, -- visit_reminder, conversion_alert, target_achieved, etc.
  
  -- Linking
  related_entity_type VARCHAR(30), -- customer, visit, territory, etc.
  related_entity_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Actions
  action_url TEXT,
  action_text VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

COMMENT ON TABLE notifications IS 'User notifications and alerts';

-- =============================================================================
-- SETTINGS TABLE (for app configuration)
-- =============================================================================

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(50) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE settings IS 'Application configuration settings';

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('visit_geofence_radius', '{"meters": 200}', 'Maximum distance allowed for check-in from customer location'),
('max_check_in_speed', '{"kmh": 10}', 'Maximum speed allowed for check-in (anti-fake GPS)'),
('location_ping_interval', '{"seconds": 300}', 'Interval between location pings'),
('working_hours', '{"start": "09:00", "end": "18:00"}', 'Standard working hours'),
('cement_calculator_rates', '{"slab_per_sqft": 0.8, "column_per_sqft": 1.2, "beam_per_sqft": 0.6, "foundation_per_sqft": 1.0}', 'Cement requirement rates per sqft');

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_territories_updated_at
  BEFORE UPDATE ON territories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_plans_updated_at
  BEFORE UPDATE ON route_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371000; -- Earth radius in meters
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dLat := RADIANS(lat2 - lat1);
  dLon := RADIANS(lon2 - lon1);
  a := SIN(dLat/2) * SIN(dLat/2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dLon/2) * SIN(dLon/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer visit stats
CREATE OR REPLACE FUNCTION update_customer_visit_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.checked_out_at IS NOT NULL THEN
    UPDATE customers
    SET 
      last_visit_at = NEW.checked_out_at,
      last_visit_outcome = NEW.outcome,
      visit_count = visit_count + 1,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_on_visit_complete
  AFTER UPDATE ON visits
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_customer_visit_stats();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, employee_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'sales_rep'),
    COALESCE(NEW.raw_user_meta_data->>'employee_code', 'EMP-' || substring(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- HIERARCHY FUNCTIONS
-- =============================================================================

-- Function to recursively get all subordinate IDs for a manager
CREATE OR REPLACE FUNCTION get_subordinate_ids(manager_id UUID)
RETURNS TABLE(subordinate_id UUID) AS $$
  WITH RECURSIVE subordinates AS (
    -- Base case: direct reports
    SELECT id FROM profiles WHERE reports_to = manager_id
    UNION
    -- Recursive case: reports of reports
    SELECT p.id FROM profiles p
    INNER JOIN subordinates s ON p.reports_to = s.id
  )
  SELECT id FROM subordinates;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_subordinate_ids IS 'Recursively get all subordinate user IDs for a given manager';

-- Function to get all accessible user IDs based on role and hierarchy
CREATE OR REPLACE FUNCTION get_accessible_user_ids(user_id UUID)
RETURNS TABLE(accessible_id UUID) AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  -- Country head sees everyone
  IF user_role = 'country_head' THEN
    RETURN QUERY SELECT id FROM profiles;
  -- Everyone else sees themselves + their subordinates
  ELSE
    RETURN QUERY 
      SELECT user_id AS accessible_id
      UNION
      SELECT subordinate_id FROM get_subordinate_ids(user_id);
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_accessible_user_ids IS 'Get all user IDs accessible to a given user based on reporting hierarchy';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROFILES RLS POLICIES
-- =============================================================================

-- Everyone can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Hierarchy-based profile access: users can read profiles they have access to
CREATE POLICY "Users can read accessible profiles via hierarchy"
  ON profiles FOR SELECT
  USING (
    id IN (SELECT accessible_id FROM get_accessible_user_ids(auth.uid()))
  );

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Managers can update their subordinates via hierarchy
CREATE POLICY "Managers can update subordinate profiles"
  ON profiles FOR UPDATE
  USING (
    id IN (SELECT accessible_id FROM get_accessible_user_ids(auth.uid()))
    AND auth.uid() != id  -- Cannot update own profile through this policy
  );

-- Only country heads can create/delete profiles
CREATE POLICY "Country heads can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'country_head'
    )
  );

CREATE POLICY "Country heads can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'country_head'
    )
  );

-- =============================================================================
-- TERRITORIES RLS POLICIES
-- =============================================================================

-- Sales reps can read their assigned territories
CREATE POLICY "Sales reps can read assigned territories"
  ON territories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'sales_rep'
      AND territories.id = ANY(p.territory_ids)
    )
  );

-- Supervisors can read territories they manage
CREATE POLICY "Supervisors can read managed territories"
  ON territories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'supervisor'
      AND territories.supervisor_id = p.id
    )
  );

-- Area managers can read territories in their area
CREATE POLICY "Area managers can read area territories"
  ON territories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'area_manager'
      AND territories.area = p.area
    )
  );

-- Regional managers can read territories in their region
CREATE POLICY "Regional managers can read region territories"
  ON territories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'regional_manager'
      AND territories.region = p.region
    )
  );

-- Country heads can read all territories
CREATE POLICY "Country heads can read all territories"
  ON territories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'country_head'
    )
  );

-- Only area managers and above can modify territories
CREATE POLICY "Area managers can modify territories"
  ON territories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('area_manager', 'regional_manager', 'country_head')
      AND (
        (p.role = 'area_manager' AND territories.area = p.area)
        OR (p.role = 'regional_manager' AND territories.region = p.region)
        OR p.role = 'country_head'
      )
    )
  );

-- =============================================================================
-- CUSTOMERS RLS POLICIES
-- =============================================================================

-- Sales reps can read customers in their territories
CREATE POLICY "Sales reps can read territory customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'sales_rep'
      AND customers.territory_id = ANY(p.territory_ids)
    )
  );

-- Sales reps can read their assigned customers
CREATE POLICY "Sales reps can read assigned customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'sales_rep'
      AND customers.assigned_to = p.id
    )
  );

-- Supervisors can read customers in their territories
CREATE POLICY "Supervisors can read territory customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN territories t ON t.supervisor_id = p.id
      WHERE p.id = auth.uid()
      AND p.role = 'supervisor'
      AND customers.territory_id = t.id
    )
  );

-- Area managers can read customers in their area
CREATE POLICY "Area managers can read area customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN territories t ON t.area = p.area
      WHERE p.id = auth.uid()
      AND p.role = 'area_manager'
      AND customers.territory_id = t.id
    )
  );

-- Regional managers can read customers in their region
CREATE POLICY "Regional managers can read region customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN territories t ON t.region = p.region
      WHERE p.id = auth.uid()
      AND p.role = 'regional_manager'
      AND customers.territory_id = t.id
    )
  );

-- Country heads can read all customers
CREATE POLICY "Country heads can read all customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'country_head'
    )
  );

-- Sales reps can create customers in their territories
CREATE POLICY "Sales reps can create territory customers"
  ON customers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'sales_rep'
      AND customers.territory_id = ANY(p.territory_ids)
    )
  );

-- Sales reps can update their assigned customers
CREATE POLICY "Sales reps can update assigned customers"
  ON customers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'sales_rep'
      AND (customers.assigned_to = p.id OR customers.created_by = p.id)
    )
  );

-- Supervisors and above can manage all customers in their scope
CREATE POLICY "Managers can manage customers"
  ON customers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN territories t ON t.id = customers.territory_id
      WHERE p.id = auth.uid()
      AND p.role IN ('supervisor', 'area_manager', 'regional_manager', 'country_head')
      AND (
        (p.role = 'supervisor' AND t.supervisor_id = p.id)
        OR (p.role = 'area_manager' AND t.area = p.area)
        OR (p.role = 'regional_manager' AND t.region = p.region)
        OR p.role = 'country_head'
      )
    )
  );

-- =============================================================================
-- VISITS RLS POLICIES
-- =============================================================================

-- Sales reps can read their own visits
CREATE POLICY "Sales reps can read own visits"
  ON visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'sales_rep'
      AND visits.sales_rep_id = p.id
    )
  );

-- Sales reps can read visits for their assigned customers
CREATE POLICY "Sales reps can read customer visits"
  ON visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN customers c ON c.assigned_to = p.id
      WHERE p.id = auth.uid()
      AND p.role = 'sales_rep'
      AND visits.customer_id = c.id
    )
  );

-- Supervisors can read visits in their territories
CREATE POLICY "Supervisors can read territory visits"
  ON visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN territories t ON t.supervisor_id = p.id
      JOIN customers c ON c.territory_id = t.id
      WHERE p.id = auth.uid()
      AND p.role = 'supervisor'
      AND visits.customer_id = c.id
    )
  );

-- Area managers can read visits in their area
CREATE POLICY "Area managers can read area visits"
  ON visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN territories t ON t.area = p.area
      JOIN customers c ON c.territory_id = t.id
      WHERE p.id = auth.uid()
      AND p.role = 'area_manager'
      AND visits.customer_id = c.id
    )
  );

-- Regional managers can read visits in their region
CREATE POLICY "Regional managers can read region visits"
  ON visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN territories t ON t.region = p.region
      JOIN customers c ON c.territory_id = t.id
      WHERE p.id = auth.uid()
      AND p.role = 'regional_manager'
      AND visits.customer_id = c.id
    )
  );

-- Country heads can read all visits
CREATE POLICY "Country heads can read all visits"
  ON visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'country_head'
    )
  );

-- Sales reps can create their own visits
CREATE POLICY "Sales reps can create own visits"
  ON visits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'sales_rep'
      AND visits.sales_rep_id = p.id
    )
  );

-- Sales reps can update their own visits
CREATE POLICY "Sales reps can update own visits"
  ON visits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'sales_rep'
      AND visits.sales_rep_id = p.id
    )
  );

-- Supervisors and above can manage visits in their scope
CREATE POLICY "Managers can manage visits"
  ON visits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN customers c ON c.id = visits.customer_id
      JOIN territories t ON t.id = c.territory_id
      WHERE p.id = auth.uid()
      AND p.role IN ('supervisor', 'area_manager', 'regional_manager', 'country_head')
      AND (
        (p.role = 'supervisor' AND t.supervisor_id = p.id)
        OR (p.role = 'area_manager' AND t.area = p.area)
        OR (p.role = 'regional_manager' AND t.region = p.region)
        OR p.role = 'country_head'
      )
    )
  );

-- =============================================================================
-- ROUTE PLANS RLS POLICIES
-- =============================================================================

CREATE POLICY "Sales reps can read own route plans"
  ON route_plans FOR SELECT
  USING (sales_rep_id = auth.uid());

CREATE POLICY "Sales reps can create own route plans"
  ON route_plans FOR INSERT
  WITH CHECK (sales_rep_id = auth.uid());

CREATE POLICY "Sales reps can update own route plans"
  ON route_plans FOR UPDATE
  USING (sales_rep_id = auth.uid());

CREATE POLICY "Supervisors can read team route plans"
  ON route_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'supervisor'
      AND route_plans.sales_rep_id = ANY(
        SELECT id FROM profiles WHERE supervisor_id = p.id
      )
    )
  );

CREATE POLICY "Area managers can read area route plans"
  ON route_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN profiles rep ON rep.area = p.area
      WHERE p.id = auth.uid()
      AND p.role = 'area_manager'
      AND route_plans.sales_rep_id = rep.id
    )
  );

CREATE POLICY "Regional managers can read region route plans"
  ON route_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN profiles rep ON rep.region = p.region
      WHERE p.id = auth.uid()
      AND p.role = 'regional_manager'
      AND route_plans.sales_rep_id = rep.id
    )
  );

CREATE POLICY "Country heads can read all route plans"
  ON route_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'country_head'
    )
  );

-- =============================================================================
-- ATTENDANCE RLS POLICIES
-- =============================================================================

CREATE POLICY "Users can read own attendance"
  ON attendance FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own attendance"
  ON attendance FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own attendance"
  ON attendance FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Supervisors can read team attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'supervisor'
      AND attendance.user_id = ANY(
        SELECT id FROM profiles WHERE supervisor_id = p.id
      )
    )
  );

CREATE POLICY "Area managers can read area attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN profiles sub ON sub.area = p.area
      WHERE p.id = auth.uid()
      AND p.role = 'area_manager'
      AND attendance.user_id = sub.id
    )
  );

CREATE POLICY "Regional managers can read region attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN profiles sub ON sub.region = p.region
      WHERE p.id = auth.uid()
      AND p.role = 'regional_manager'
      AND attendance.user_id = sub.id
    )
  );

CREATE POLICY "Country heads can read all attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'country_head'
    )
  );

-- =============================================================================
-- LOCATION PINGS RLS POLICIES
-- =============================================================================

CREATE POLICY "Users can create own location pings"
  ON location_pings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own location pings"
  ON location_pings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Supervisors can read team location pings"
  ON location_pings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'supervisor'
      AND location_pings.user_id = ANY(
        SELECT id FROM profiles WHERE supervisor_id = p.id
      )
    )
  );

CREATE POLICY "Area managers can read area location pings"
  ON location_pings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN profiles sub ON sub.area = p.area
      WHERE p.id = auth.uid()
      AND p.role = 'area_manager'
      AND location_pings.user_id = sub.id
    )
  );

CREATE POLICY "Regional managers can read region location pings"
  ON location_pings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN profiles sub ON sub.region = p.region
      WHERE p.id = auth.uid()
      AND p.role = 'regional_manager'
      AND location_pings.user_id = sub.id
    )
  );

CREATE POLICY "Country heads can read all location pings"
  ON location_pings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'country_head'
    )
  );

-- =============================================================================
-- CONVERSIONS RLS POLICIES
-- =============================================================================

CREATE POLICY "Sales reps can read own conversions"
  ON conversions FOR SELECT
  USING (converted_by = auth.uid());

CREATE POLICY "Sales reps can create conversions"
  ON conversions FOR INSERT
  WITH CHECK (converted_by = auth.uid());

CREATE POLICY "Supervisors can read team conversions"
  ON conversions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'supervisor'
      AND conversions.converted_by = ANY(
        SELECT id FROM profiles WHERE supervisor_id = p.id
      )
    )
  );

CREATE POLICY "Area managers can read area conversions"
  ON conversions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN profiles rep ON rep.area = p.area
      WHERE p.id = auth.uid()
      AND p.role = 'area_manager'
      AND conversions.converted_by = rep.id
    )
  );

CREATE POLICY "Regional managers can read region conversions"
  ON conversions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN profiles rep ON rep.region = p.region
      WHERE p.id = auth.uid()
      AND p.role = 'regional_manager'
      AND conversions.converted_by = rep.id
    )
  );

CREATE POLICY "Country heads can read all conversions"
  ON conversions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'country_head'
    )
  );

-- Supervisors can approve conversions
CREATE POLICY "Supervisors can approve conversions"
  ON conversions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('supervisor', 'area_manager', 'regional_manager', 'country_head')
    )
  );

-- =============================================================================
-- PRODUCTS RLS POLICIES
-- =============================================================================

CREATE POLICY "Everyone can read active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Country heads can manage products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'country_head'
    )
  );

-- =============================================================================
-- DASHBOARD STATS RLS POLICIES
-- =============================================================================

CREATE POLICY "Users can read own dashboard stats"
  ON dashboard_stats FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can read territory dashboard stats"
  ON dashboard_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND dashboard_stats.territory_id = ANY(p.territory_ids)
    )
  );

CREATE POLICY "Area managers can read area dashboard stats"
  ON dashboard_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN territories t ON t.area = p.area
      WHERE p.id = auth.uid()
      AND p.role = 'area_manager'
      AND dashboard_stats.territory_id = t.id
    )
  );

CREATE POLICY "Regional managers can read region dashboard stats"
  ON dashboard_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN territories t ON t.region = p.region
      WHERE p.id = auth.uid()
      AND p.role = 'regional_manager'
      AND dashboard_stats.territory_id = t.id
    )
  );

CREATE POLICY "Country heads can read all dashboard stats"
  ON dashboard_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'country_head'
    )
  );

-- =============================================================================
-- NOTIFICATIONS RLS POLICIES
-- =============================================================================

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- System can create notifications (via service role)
-- Applications should use service role key for notification creation

-- =============================================================================
-- SETTINGS RLS POLICIES
-- =============================================================================

CREATE POLICY "Everyone can read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Country heads can manage settings"
  ON settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'country_head'
    )
  );

-- =============================================================================
-- SAMPLE DATA INSERTION
-- =============================================================================

-- Insert sample products
INSERT INTO products (name, code, description, category, price_per_bag, strength_grade) VALUES
('Aman Portland Cement', 'APC-OPC-43', 'Ordinary Portland Cement Grade 43', 'OPC', 520.00, '43'),
('Aman Strong Cement', 'ASC-OPC-53', 'Ordinary Portland Cement Grade 53', 'OPC', 580.00, '53'),
('Aman PPC Cement', 'APPC-1', 'Portland Pozzolana Cement', 'PPC', 490.00, '33'),
('Aman SRC Cement', 'ASRC-1', 'Sulfate Resistant Cement', 'Special', 650.00, '43'),
('Aman White Cement', 'AWC-1', 'White Portland Cement', 'Special', 1200.00, '33');

-- Insert sample territories (Dhaka region example)
INSERT INTO territories (name, code, color, region, area, center_lat, center_lng, geojson) VALUES
('Mirpur', 'DHK-MIR', 'territory_a', 'Dhaka', 'North Dhaka', 23.8223, 90.3654, '
{
  "type": "Polygon",
  "coordinates": [[[90.35, 23.81], [90.38, 23.81], [90.38, 23.835], [90.35, 23.835], [90.35, 23.81]]]
}'::jsonb),
('Gulshan', 'DHK-GUL', 'territory_b', 'Dhaka', 'North Dhaka', 23.7925, 90.4078, '
{
  "type": "Polygon", 
  "coordinates": [[[90.395, 23.78], [90.42, 23.78], [90.42, 23.805], [90.395, 23.805], [90.395, 23.78]]]
}'::jsonb),
('Dhanmondi', 'DHK-DHN', 'territory_c', 'Dhaka', 'South Dhaka', 23.7465, 90.3760, '
{
  "type": "Polygon",
  "coordinates": [[[90.365, 23.735], [90.387, 23.735], [90.387, 23.758], [90.365, 23.758], [90.365, 23.735]]]
}'::jsonb),
('Motijheel', 'DHK-MOT', 'territory_d', 'Dhaka', 'South Dhaka', 23.7333, 90.4167, '
{
  "type": "Polygon",
  "coordinates": [[[90.405, 23.72], [90.428, 23.72], [90.428, 23.745], [90.405, 23.745], [90.405, 23.72]]]
}'::jsonb),
('Uttara', 'DHK-UTT', 'territory_e', 'Dhaka', 'North Dhaka', 23.8740, 90.3940, '
{
  "type": "Polygon",
  "coordinates": [[[90.38, 23.86], [90.408, 23.86], [90.408, 23.888], [90.38, 23.888], [90.38, 23.86]]]
}'::jsonb);

-- =============================================================================
-- VIEWS FOR CONVENIENCE
-- =============================================================================

-- View: Sales rep performance summary
CREATE VIEW sales_rep_performance AS
SELECT 
  p.id as sales_rep_id,
  p.full_name,
  p.employee_code,
  p.role,
  COUNT(DISTINCT c.id) as total_customers,
  COUNT(DISTINCT CASE WHEN c.is_converted THEN c.id END) as converted_customers,
  COUNT(DISTINCT v.id) as total_visits,
  COUNT(DISTINCT CASE WHEN v.status = 'completed' THEN v.id END) as completed_visits,
  COALESCE(SUM(conv.order_value), 0) as total_sales
FROM profiles p
LEFT JOIN customers c ON c.assigned_to = p.id
LEFT JOIN visits v ON v.sales_rep_id = p.id
LEFT JOIN conversions conv ON conv.converted_by = p.id
WHERE p.role = 'sales_rep'
GROUP BY p.id, p.full_name, p.employee_code, p.role;

-- View: Territory performance summary
CREATE VIEW territory_performance AS
SELECT 
  t.id as territory_id,
  t.name as territory_name,
  t.code as territory_code,
  t.color,
  t.region,
  t.area,
  COUNT(DISTINCT c.id) as total_customers,
  COUNT(DISTINCT CASE WHEN c.pipeline = 'recurring' THEN c.id END) as recurring_customers,
  COUNT(DISTINCT CASE WHEN c.pipeline = 'one_time' THEN c.id END) as project_customers,
  COUNT(DISTINCT CASE WHEN c.is_converted THEN c.id END) as converted_customers,
  COUNT(DISTINCT v.id) as total_visits,
  COALESCE(SUM(conv.order_value), 0) as total_sales
FROM territories t
LEFT JOIN customers c ON c.territory_id = t.id
LEFT JOIN visits v ON v.customer_id = c.id
LEFT JOIN conversions conv ON conv.customer_id = c.id
GROUP BY t.id, t.name, t.code, t.color, t.region, t.area;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions on views
GRANT SELECT ON sales_rep_performance TO authenticated;
GRANT SELECT ON territory_performance TO authenticated;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
