import type { MyServicesScope, Role, ServiceFilters, VehicleFilters } from '../types';

export const queryKeys = {
  users: (role?: Role) => ['users', role ?? 'all'] as const,
  vehicles: (filters: VehicleFilters = {}) => ['vehicles', filters] as const,
  services: (filters: ServiceFilters = {}) => ['services', filters] as const,
  summary: () => ['stats', 'summary'] as const,
  timeline: (vehicleId: string) => ['stats', 'timeline', vehicleId] as const,
  myVehicles: () => ['me', 'vehicles'] as const,
  myServices: (scope: MyServicesScope) => ['me', 'services', scope] as const,
};

/** Root keys touched by any service/vehicle change: lists, stats and "me" views. */
export const SERVICE_DEPENDENT_KEYS = [['services'], ['stats'], ['me']] as const;
export const VEHICLE_DEPENDENT_KEYS = [['vehicles'], ['services'], ['stats'], ['me']] as const;
