// ============================================================
// AMAN CEMENT CRM — TypeScript Type Definitions
// ============================================================

// User Roles
export type UserRole = 'sales_rep' | 'supervisor' | 'area_manager' | 'regional_manager' | 'country_head';

// User (maps to profiles table)
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
  parent_id?: string;
  level: number;
  boundary: GeoJSONPolygon;
  color_key: TerritoryColorKey;
  created_at: string;
  stats?: TerritoryStats;
}

export type TerritoryColorKey =
  | 'territory_a' | 'territory_b' | 'territory_c' | 'territory_d'
  | 'territory_e' | 'territory_f' | 'territory_g' | 'territory_h';

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface TerritoryStats {
  totalCustomers: number;
  recurringCount: number;
  projectCount: number;
  monthlyVolume: number;
  activeReps: number;
  conversionRate: number;
}

// Customer Pipeline Types
export type PipelineType = 'recurring' | 'one_time';
export type CustomerStatus = 'active' | 'archived';
export type VisitOutcome = 'interested' | 'progressive' | 'not_interested' | 'stagnant' | 'new';
export type CreditPractice = 'cash' | 'credit';
export type StructureType = 'RCC' | 'Steel' | 'Mixed';

// Brand Sales Data
export interface BrandSalesData {
  brand: string;
  monthlySales: number;
  sellingPrice: number;
}

// Recurring Customer Data (Pipeline A)
export interface RecurringCustomerData {
  owner_age?: number;
  monthly_sales: BrandSalesData[];
  offers_last_6_months: string[];
  brand_preference_ranking: string[];
  competitor_brands: string[];
  storage_capacity_tons: number;
  credit_practice: CreditPractice;
  credit_days?: number;
}

// Project Customer Data (Pipeline B)
export interface ProjectCustomerData {
  built_up_area_sqft: number;
  number_of_floors: number;
  structure_type: StructureType;
  construction_stage_percent: number;
  cement_requirement_tons: number;
  cement_consumed_tons: number;
  current_brand?: string;
  project_started: boolean;
}

// Customer
export interface Customer {
  id: string;
  pipeline: PipelineType;
  name: string;
  owner_name?: string;
  phone?: string;
  latitude: number;
  longitude: number;
  area?: string;
  territory_id: string;
  sales_rep_id: string;
  status: CustomerStatus;
  pipeline_data: RecurringCustomerData | ProjectCustomerData;
  last_outcome?: VisitOutcome;
  last_visit_at?: string;
  last_visit_outcome?: VisitOutcome;
  created_at: string;
  updated_at: string;
  // Joined fields
  territory_name?: string;
  territory_color_key?: TerritoryColorKey;
  sales_rep_name?: string;
  territories?: any; // For joined territory data
}

// Visit
export interface Visit {
  id: string;
  customer_id: string;
  sales_rep_id: string;
  checkin_lat?: number;
  checkin_lng?: number;
  checkin_at?: string;
  outcome?: VisitOutcome;
  note?: string;
  voice_memo_url?: string;
  completed: boolean;
  created_at: string;
  // Joined fields
  customer_name?: string;
  customer_pipeline?: PipelineType;
}

// Route Plan
export interface RouteStop {
  customer_id: string;
  priority_score: number;
  order: number;
  customer_name?: string;
  latitude?: number;
  longitude?: number;
}

export interface RoutePlan {
  id: string;
  sales_rep_id: string;
  plan_date: string;
  stops: RouteStop[];
  created_at: string;
}

// Attendance
export interface Attendance {
  id: string;
  sales_rep_id: string;
  date: string;
  day_start_at?: string;
  day_start_lat?: number;
  day_start_lng?: number;
  day_end_at?: string;
  day_end_lat?: number;
  day_end_lng?: number;
  created_at: string;
}

// Location Ping
export interface LocationPing {
  id: string;
  sales_rep_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  created_at: string;
}

// Dashboard Data
export interface RepDashboardData {
  todayRoute: RoutePlan | null;
  visitsToday: number;
  visitsTarget: number;
  hotProspects: Customer[];
  pendingFollowups: Customer[];
  territoryCustomers: Customer[];
}

export interface SupervisorDashboardData {
  teamVisits: TeamVisitData[];
  coverageGaps: Territory[];
  highPotentialNonConverters: Customer[];
  repComparisons: RepComparison[];
  routeDeviations: RouteDeviation[];
}

export interface TeamVisitData {
  rep_id: string;
  rep_name: string;
  customers: { customer_id: string; customer_name: string; status: string }[];
}

export interface RepComparison {
  rep_id: string;
  rep_name: string;
  visits: number;
  conversions: number;
  volume: number;
}

export interface RouteDeviation {
  rep_id: string;
  rep_name: string;
  deviation_time: string;
  deviation_distance: number;
}

export interface ManagementDashboardData {
  totalCustomers: number;
  totalTerritories: number;
  monthlyVolume: number;
  conversionFunnel: ConversionFunnel;
  territoryRankings: TerritoryRanking[];
  liveRepPositions: LiveRepPosition[];
}

export interface ConversionFunnel {
  mapped: number;
  visited: number;
  interested: number;
  converted: number;
  volume: number;
}

export interface TerritoryRanking {
  territory_id: string;
  territory_name: string;
  color_key: TerritoryColorKey;
  conversion_rate: number;
  volume: number;
  coverage: number;
}

export interface LiveRepPosition {
  rep_id: string;
  rep_name: string;
  latitude: number;
  longitude: number;
  last_ping: string;
}

// Leakage Detection
export interface LeakageAlert {
  type: 'low_visit_frequency' | 'high_interest_no_order' | 'brand_switch' | 'stagnation' | 'dead_zone' | 'target_gap';
  customer_id?: string;
  customer_name?: string;
  territory_id?: string;
  territory_name?: string;
  severity: 'warning' | 'critical';
  message: string;
  detected_at: string;
}

// Map Filter State
export interface MapFilterState {
  showRecurring: boolean;
  showProjects: boolean;
  showArchived: boolean;
  selectedTerritories: string[];
  showHeatmap: boolean;
  showLiveReps: boolean;
}

// Auth State
export interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
}

// Aman Cement Brand Colors
export interface BrandColors {
  amanNavy: '#0A2A5C';
  deepNavy: '#061A3A';
  navySurface: '#0F3460';
  navyElevated: '#143874';
  amanRed: '#C41E3A';
  redDeep: '#9B1830';
  iceWhite: '#F0F4F8';
  steelGray: '#8B9CB8';
  darkSteel: '#4A5B7A';
  corporateGold: '#D4A843';
  successGreen: '#2ECC71';
  infoBlue: '#3A9EFF';
  warningRed: '#E74C5E';
  cautionOrange: '#FF7C3A';
  freshTeal: '#2DD4BF';
  premiumPurple: '#9B6BFF';
}
