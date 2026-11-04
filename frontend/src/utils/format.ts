import type { Service, ServiceType } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-06" -> "Jun 26" */
export function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const index = Number(m) - 1;
  if (!year || Number.isNaN(index) || !MONTHS[index]) return month;
  return `${MONTHS[index]} ${year.slice(-2)}`;
}

/** Month key ("2026-06") for a date in UTC, matching the backend's aggregation. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** ISO string -> "YYYY-MM-DD" for <input type="date">. */
export function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}

/** "YYYY-MM-DD" from a date input -> ISO midnight UTC. */
export function fromDateInput(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  'oil-change': 'Oil change',
  'tire-rotation': 'Tire rotation',
  'brake-inspection': 'Brake inspection',
  'battery-check': 'Battery check',
  'engine-diagnostics': 'Engine diagnostics',
  'transmission-service': 'Transmission service',
  'general-inspection': 'General inspection',
  other: 'Other',
};

export function serviceTypeLabel(type: ServiceType): string {
  return SERVICE_TYPE_LABELS[type] ?? type;
}

export function isOverdue(service: Pick<Service, 'status' | 'scheduledDate'>): boolean {
  return service.status !== 'completed' && new Date(service.scheduledDate).getTime() < Date.now();
}

export function vehicleLabel(vehicle: { registrationNumber: string; make: string; model: string } | null): string {
  if (!vehicle) return 'Deleted vehicle';
  return `${vehicle.registrationNumber} · ${vehicle.make} ${vehicle.model}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
