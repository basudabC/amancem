// ============================================================
// AMAN CEMENT CRM — Brand Constants & Configuration
// ============================================================

import type { TerritoryColorKey } from '@/types';

// ============================================================
// BRAND COLORS — Aman Cement Identity
// ============================================================

export const COLORS = {
  // Primary Brand Colors
  amanNavy: '#0A2A5C',
  deepNavy: '#061A3A',
  navySurface: '#0F3460',
  navyElevated: '#143874',

  // Accent Colors
  amanRed: '#C41E3A',
  redDeep: '#9B1830',
  redTransparent: 'rgba(196,30,58,0.12)',

  // Text Colors
  iceWhite: '#F0F4F8',
  steelGray: '#8B9CB8',
  darkSteel: '#4A5B7A',

  // Border Colors
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderActive: 'rgba(255,255,255,0.14)',

  // Gold Accent
  corporateGold: '#D4A843',
  goldTransparent: 'rgba(212,168,67,0.10)',

  // Status Colors
  successGreen: '#2ECC71',
  infoBlue: '#3A9EFF',
  warningRed: '#E74C5E',
  cautionOrange: '#FF7C3A',
  freshTeal: '#2DD4BF',
  premiumPurple: '#9B6BFF',
} as const;

// ============================================================
// TERRITORY COLORS — Single Source of Truth
// ============================================================

export const TERRITORY_COLORS: Record<TerritoryColorKey, { fill: string; stroke: string; name: string }> = {
  territory_a: { fill: '#3A9EFF', stroke: '#3A9EFF', name: 'Territory A' },
  territory_b: { fill: '#C41E3A', stroke: '#C41E3A', name: 'Territory B' },
  territory_c: { fill: '#2ECC71', stroke: '#2ECC71', name: 'Territory C' },
  territory_d: { fill: '#9B6BFF', stroke: '#9B6BFF', name: 'Territory D' },
  territory_e: { fill: '#D4A843', stroke: '#D4A843', name: 'Territory E' },
  territory_f: { fill: '#FF7C3A', stroke: '#FF7C3A', name: 'Territory F' },
  territory_g: { fill: '#2DD4BF', stroke: '#2DD4BF', name: 'Territory G' },
  territory_h: { fill: '#E74C5E', stroke: '#E74C5E', name: 'Territory H' },
};

// ============================================================
// STATUS COLOR MAPPING
// ============================================================

export const STATUS_COLORS = {
  // Visit Outcomes
  interested: '#2ECC71',
  progressive: '#3A9EFF',
  not_interested: '#E74C5E',
  stagnant: '#FF7C3A',
  new: '#2DD4BF',

  // Customer Status
  active: '#2ECC71',
  archived: '#4A5B7A',

  // Project Stages
  early_stage: '#9B6BFF',
  mid_construction: '#D4A843',
  nearing_completion: '#FF7C3A',
  completed: '#4A5B7A',
} as const;

// ============================================================
// GOOGLE MAPS CONFIGURATION
// ============================================================

export const MAP_CONFIG = {
  defaultCenter: { lat: 23.8103, lng: 90.4125 }, // Dhaka, Bangladesh
  defaultZoom: 9, // Wide view showing all territories
  territoryZoom: 10, // Division level
  districtZoom: 13, // District/Upazila level
  checkInRadius: 200, // meters
  maxCheckInSpeed: 60, // km/h
};

// Google Maps Dark Theme — Aman Navy Brand
export const AMAN_MAP_STYLES = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#0F3460' }],
  },
  {
    elementType: 'geometry.fill',
    stylers: [{ color: '#0A2A5C' }],
  },
  {
    elementType: 'geometry.stroke',
    stylers: [{ color: '#143874' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8B9CB8' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#061A3A' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#143874' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0A2A5C' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1A4A8A' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0F3460' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0D1F3C' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3A6EA5' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#0C2544' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#0E2D52' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1A3A6B', opacity: 0.4 }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6B8CB8' }],
  },
];

// Heatmap Gradient
export const HEATMAP_GRADIENT = [
  'rgba(6,26,58,0)',
  'rgba(58,158,255,0.25)',
  'rgba(212,168,67,0.50)',
  'rgba(196,30,58,0.75)',
  'rgba(196,30,58,1.0)',
];

// ============================================================
// AMAN CEMENT PRODUCT LINES
// ============================================================

export const AMAN_PRODUCTS = [
  'AmanCem Advance',
  'AmanCem Advance Plus',
  'AmanCem Green',
  'AmanCem Basic',
  'AmanCem Classic',
] as const;

// Competitor Brands (Bangladesh Market)
export const COMPETITOR_BRANDS = [
  'Shah Cement',
  'Seven Rings Cement',
  'Premier Cement',
  'Diamond Cement',
  'Ruby Cement',
  'Bashundhara Cement',
  'Holcim',
  'Other',
] as const;

// ============================================================
// BANGLADESH ADMINISTRATIVE DATA
// ============================================================

export const BANGLADESH_DIVISIONS = [
  'Barisal',
  'Chittagong',
  'Dhaka',
  'Khulna',
  'Mymensingh',
  'Rajshahi',
  'Rangpur',
  'Sylhet',
] as const;

// Key Cement Market Zones
export const CEMENT_MARKET_ZONES = [
  'Dhaka',
  'Chittagong',
  'Rajshahi',
  'Sylhet',
  'Khulna',
  'Comilla',
  'Gazipur',
  'Narayanganj',
] as const;

// ============================================================
// CEMENT CALCULATION FORMULAS
// ============================================================

export const calculateCementRequirement = (
  builtUpArea: number,
  floors: number,
  structureType: 'RCC' | 'Steel' | 'Mixed'
): number => {
  let cement = 0;

  switch (structureType) {
    case 'RCC':
      cement = builtUpArea * (0.25 + (floors - 1) * 0.18);
      break;
    case 'Steel':
      cement = builtUpArea * 0.15 * floors;
      break;
    case 'Mixed':
      cement = builtUpArea * 0.20 * floors;
      break;
  }

  // Add 10% wastage buffer and round to 1 decimal
  return Math.round(cement * 1.10 * 10) / 10;
};

// ============================================================
// APP CONFIGURATION
// ============================================================

export const APP_CONFIG = {
  name: 'AmanEdge CRM',
  company: 'Aman Cement Mills Ltd.',
  parentGroup: 'Aman Group Ltd.',
  version: '1.0.0',

  // Contact Info
  headOffice: '2 Ishakha Avenue, Sector-06, Uttara, Dhaka-1230',
  phone: '+8809606-613000',
  email: 'info@amangroupbd.com',
  website: 'www.amancem.com',

  // Factory
  factoryLocation: 'Aman Economic Zone, Haria, Bodyer Bazar, Sonargaon, Narayanganj',
  productionCapacity: '10,000 MT per day',

  // PWA
  shortName: 'AmanEdge',
  themeColor: '#0A2A5C',
  backgroundColor: '#061A3A',
};

// ============================================================
// PERFORMANCE TARGETS
// ============================================================

export const PERFORMANCE_TARGETS = {
  uiAction: 300, // ms
  dashboardRender: 1500, // ms
  mapLoad: 2000, // ms
  polygonRender: 500, // ms
  offlineRead: 100, // ms
  concurrentUsers: 100,
};

// ============================================================
// LEAKAGE DETECTION RULES
// ============================================================

export const LEAKAGE_RULES = {
  lowVisitFrequency: {
    threshold: 2,
    days: 14,
    severity: 'warning' as const,
  },
  highInterestNoOrder: {
    interestedCount: 3,
    orderCount: 0,
    severity: 'critical' as const,
  },
  stagnation: {
    days: 21,
    severity: 'warning' as const,
  },
  deadZone: {
    days: 7,
    severity: 'critical' as const,
  },
  targetGap: {
    threshold: 0.6, // 60%
    severity: 'critical' as const,
  },
};
