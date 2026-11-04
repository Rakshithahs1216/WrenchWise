import type { Vehicle, VehicleFilters, VehicleInput } from '../types';
import { request } from './client';

export const vehiclesApi = {
  list: (filters: VehicleFilters = {}) =>
    request<{ vehicles: Vehicle[] }>('/vehicles', { query: { ...filters } }).then((r) => r.vehicles),
  get: (id: string) => request<{ vehicle: Vehicle }>(`/vehicles/${id}`).then((r) => r.vehicle),
  create: (input: VehicleInput) =>
    request<{ vehicle: Vehicle }>('/vehicles', { method: 'POST', body: input }).then((r) => r.vehicle),
  update: (id: string, input: Partial<VehicleInput>) =>
    request<{ vehicle: Vehicle }>(`/vehicles/${id}`, { method: 'PATCH', body: input }).then((r) => r.vehicle),
  remove: (id: string) => request<void>(`/vehicles/${id}`, { method: 'DELETE' }),
  assign: (id: string, userId: string | null) =>
    request<{ vehicle: Vehicle }>(`/vehicles/${id}/assign`, { method: 'PATCH', body: { userId } }).then(
      (r) => r.vehicle,
    ),
};
