// ============================================================
// AMAN CEMENT CRM — Enhanced TypeScript Type Definitions
// Updated to match new database schema with all workflow fields
// ============================================================

// User Roles
export type UserRole = 'sales_rep' | 'supervisor' | 'area_manager' | 'regional_manager' | 'country_head';

// User (maps to profiles table)
// ... existing types

export interface CustomerFormData {
  name: string;
  owner_name?: string;
  owner_age?: number;
  phone?: string;
  email?: string;
  address?: string;
  lat?: number;
  lng?: number;
  pipeline: PipelineType;
  shop_name?: string;
  monthly_sales_advance?: number;
  monthly_sales_advance_plus?: number;
  monthly_sales_green?: number;
  monthly_sales_basic?: number;
  monthly_sales_classic?: number;
  selling_price_advance?: number;
  selling_price_advance_plus?: number;
  selling_price_green?: number;
  selling_price_basic?: number;
  selling_price_classic?: number;
  brand_preferences?: string[];
  competitor_brands?: string[];
  storage_capacity?: number;
  credit_practice?: string;
  credit_days?: number;
  promotions_offered?: string[];
  built_up_area?: number;
  number_of_floors?: number;
  structure_type?: StructureType;
  construction_stage?: number;
  project_started?: boolean;
  current_brand?: string;
  notes?: string;
  tags?: string[];
  assigned_to?: string;
  created_by?: string;
  sales_rep_id?: string;
  sales_rep_name?: string;
  contact_person?: string;
}

export interface User {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  reports_to?: string;
  territory_ids: string[];
  region?: string;
  area?: string;
  target_monthly?: number;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

// Territory
export interface Territory {
  id: string;
  name: string;
  code: string;
  color: string;
  region: string;
  area?: string;
  supervisor_id?: string;
  geojson: any; // GeoJSON Polygon
  center_lat: number;
  center_lng: number;
  zoom_level?: number;
  target_monthly?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Customer Pipeline Types
export type PipelineType = 'recurring' | 'one_time';
export type CustomerStatus = 'prospect' | 'active' | 'inactive' | 'archived';
export type VisitOutcome = 'interested' | 'progressive' | 'not_interested' | 'stagnant';
export type VisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type CreditPractice = 'cash' | 'credit';
export type StructureType = 'RCC' | 'Steel' | 'Mixed';
export type PaymentType = 'cash' | 'credit' | 'partial';
export type DeliveryStatus = 'pending' | 'dispatched' | 'delivered';

// Enhanced Customer Interface with ALL new fields
export interface Customer {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  area?: string;
  lat?: number;
  lng?: number;
  territory_id?: string;

  // Pipeline classification
  pipeline: PipelineType;
  status: CustomerStatus;

  // Owner information (NEW)
  owner_name?: string;
  owner_age?: number;

  // For recurring customers (shops)
  shop_name?: string;
  monthly_volume?: number;

  // Recurring shop - Monthly sales by product (NEW)
  monthly_sales_advance?: number;
  monthly_sales_advance_plus?: number;
  monthly_sales_green?: number;
  monthly_sales_basic?: number;
  monthly_sales_classic?: number;

  // Recurring shop - Selling prices (NEW)
  selling_price_advance?: number;
  selling_price_advance_plus?: number;
  selling_price_green?: number;
  selling_price_basic?: number;
  selling_price_classic?: number;

  // Recurring shop - Brand and competitor data (NEW)
  brand_preferences?: string[]; // Ordered array
  competitor_brands?: string[];

  // Recurring shop - Storage and credit (NEW)
  storage_capacity?: number; // in tons
  credit_practice?: CreditPractice;
  credit_days?: number;
  promotions_offered?: string[];

  // For project customers
  project_type?: string;
  project_value?: number;
  expected_start_date?: string;
  expected_end_date?: string;

  // Project customer - Construction details (NEW)
  built_up_area?: number; // sqft
  number_of_floors?: number;
  structure_type?: StructureType;
  construction_stage?: number; // percentage 0-100
  project_started?: boolean;
  current_brand?: string;

  // Project customer - Cement tracking (NEW - auto-calculated)
  cement_required?: number; // tons
  cement_consumed?: number; // tons
  cement_remaining?: number; // tons

  // Assignment
  assigned_to?: string;
  assigned_by?: string;
  assigned_at?: string;

  // Visit tracking
  last_visit_at?: string;
  last_visit_outcome?: VisitOutcome;
  next_scheduled_visit?: string;
  visit_count?: number;

  // Conversion tracking
  is_converted: boolean;
  converted_at?: string;
  converted_by?: string;

  // Metadata
  notes?: string;
  tags?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;

  // Joined fields (for queries)
  territory_name?: string;
  sales_rep_name?: string;
  territories?: any;
  profiles?: any;

  // UI helper fields
  latitude?: number;
  longitude?: number;
  last_outcome?: VisitOutcome | string;
  territory_color_key?: string;
  pipeline_data?: any;
}

// Enhanced Visit Interface
export interface Visit {
  id: string;
  customer_id: string;
  sales_rep_id: string;

  // Visit scheduling
  scheduled_at?: string;
  scheduled_duration?: number;
  completed?: boolean;

  // Check-in details
  checked_in_at?: string;
  check_in_lat?: number;
  check_in_lng?: number;
  check_in_accuracy?: number;
  check_in_speed?: number; // for anti-fake detection

  // Check-out details
  checked_out_at?: string;
  check_out_lat?: number;
  check_out_lng?: number;

  // Visit outcomes
  status: VisitStatus;
  outcome?: VisitOutcome;

  // Visit content
  purpose?: string;
  notes?: string;
  feedback?: string;

  // Product interest
  products_discussed?: string[];
  estimated_requirement?: number;
  expected_order_date?: string;

  // Photos
  photos?: string[];

  // GPS validation (NEW)
  distance_from_customer?: number; // meters
  is_within_geofence?: boolean;
  voice_memo_url?: string;

  created_at: string;
  updated_at: string;

  // Joined fields
  customer_name?: string;
  sales_rep_name?: string;
  customer?: Customer;
}
