// ============================================================
// AMAN CEMENT CRM — Hooks Export
// ============================================================

export {
  useCustomers,
  useCustomer,
  useCreateCustomer,
  useUpdateCustomer,
  useArchiveCustomer,
  useCustomerVisits,
  useMapCustomers,
} from './useCustomers';

export {
  useTerritories,
  useTerritory,
  useCreateTerritory,
  useUpdateTerritory,
  useUserTerritories,
} from './useTerritories';

export {
  useTodayVisits,
  useVisitsByDateRange,
  useStartVisit,
  useCompleteVisit,
  validateCheckIn,
  getCurrentPosition,
  watchPosition,
  clearPositionWatch,
} from './useVisits';
