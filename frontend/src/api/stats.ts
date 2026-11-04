import type { StatsSummary, VehicleTimeline } from '../types';
import { request } from './client';

export const statsApi = {
  summary: () => request<StatsSummary>('/stats/summary'),
  vehicleTimeline: (id: string) => request<VehicleTimeline>(`/stats/vehicles/${id}/timeline`),
};
