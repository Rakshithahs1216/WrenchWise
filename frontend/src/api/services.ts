import type { Service, ServiceFilters, ServiceInput, ServiceStatus } from '../types';
import { request } from './client';

export const servicesApi = {
  list: (filters: ServiceFilters = {}) =>
    request<{ services: Service[] }>('/services', { query: { ...filters } }).then((r) => r.services),
  get: (id: string) => request<{ service: Service }>(`/services/${id}`).then((r) => r.service),
  create: (input: ServiceInput) =>
    request<{ service: Service }>('/services', { method: 'POST', body: input }).then((r) => r.service),
  update: (id: string, input: Partial<ServiceInput>) =>
    request<{ service: Service }>(`/services/${id}`, { method: 'PATCH', body: input }).then((r) => r.service),
  remove: (id: string) => request<void>(`/services/${id}`, { method: 'DELETE' }),
  updateStatus: (id: string, status: ServiceStatus) =>
    request<{ service: Service }>(`/services/${id}/status`, { method: 'PATCH', body: { status } }).then(
      (r) => r.service,
    ),
  addNote: (id: string, text: string) =>
    request<{ service: Service }>(`/services/${id}/notes`, { method: 'POST', body: { text } }).then((r) => r.service),
};
