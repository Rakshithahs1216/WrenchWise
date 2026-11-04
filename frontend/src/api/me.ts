import type { MyServicesScope, Service, Vehicle } from '../types';
import { request } from './client';

export const meApi = {
  vehicles: () => request<{ vehicles: Vehicle[] }>('/me/vehicles').then((r) => r.vehicles),
  services: (scope: MyServicesScope = 'all') =>
    request<{ services: Service[] }>('/me/services', { query: { scope } }).then((r) => r.services),
};
