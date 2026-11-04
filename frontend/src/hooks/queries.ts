import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { meApi } from '../api/me';
import { servicesApi } from '../api/services';
import { statsApi } from '../api/stats';
import { usersApi } from '../api/users';
import { vehiclesApi } from '../api/vehicles';
import type { MyServicesScope, Role, ServiceFilters, VehicleFilters } from '../types';
import { queryKeys } from './queryKeys';

export const useUsers = (role?: Role) =>
  useQuery({ queryKey: queryKeys.users(role), queryFn: () => usersApi.list(role), placeholderData: keepPreviousData });

export const useVehicles = (filters: VehicleFilters = {}) =>
  useQuery({
    queryKey: queryKeys.vehicles(filters),
    queryFn: () => vehiclesApi.list(filters),
    placeholderData: keepPreviousData,
  });

export const useServices = (filters: ServiceFilters = {}) =>
  useQuery({
    queryKey: queryKeys.services(filters),
    queryFn: () => servicesApi.list(filters),
    placeholderData: keepPreviousData,
  });

export const useSummary = () => useQuery({ queryKey: queryKeys.summary(), queryFn: statsApi.summary });

export const useVehicleTimeline = (vehicleId: string) =>
  useQuery({ queryKey: queryKeys.timeline(vehicleId), queryFn: () => statsApi.vehicleTimeline(vehicleId) });

export const useMyVehicles = () => useQuery({ queryKey: queryKeys.myVehicles(), queryFn: meApi.vehicles });

export const useMyServices = (scope: MyServicesScope) =>
  useQuery({ queryKey: queryKeys.myServices(scope), queryFn: () => meApi.services(scope) });
