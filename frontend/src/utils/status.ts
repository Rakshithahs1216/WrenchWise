import type { Role, ServiceStatus, VehicleStatus } from '../types';

interface Tone {
  label: string;
  /** Tailwind classes for a pill badge. */
  badge: string;
  /** Tailwind class for a solid dot / marker. */
  dot: string;
}

export const SERVICE_STATUS_META: Record<ServiceStatus, Tone> = {
  pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-800 ring-amber-600/20', dot: 'bg-amber-500' },
  'in-progress': { label: 'In progress', badge: 'bg-blue-50 text-blue-800 ring-blue-600/20', dot: 'bg-blue-600' },
  completed: { label: 'Completed', badge: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20', dot: 'bg-emerald-600' },
};

export const OVERDUE_TONE: Tone = { label: 'Overdue', badge: 'bg-red-50 text-red-700 ring-red-600/20', dot: 'bg-red-600' };

export const VEHICLE_STATUS_META: Record<VehicleStatus, Tone> = {
  active: { label: 'Active', badge: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20', dot: 'bg-emerald-600' },
  'in-service': { label: 'In service', badge: 'bg-blue-50 text-blue-800 ring-blue-600/20', dot: 'bg-blue-600' },
  retired: { label: 'Retired', badge: 'bg-slate-100 text-slate-700 ring-slate-500/20', dot: 'bg-slate-400' },
};

export const ROLE_META: Record<Role, Tone> = {
  admin: { label: 'Admin', badge: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20', dot: 'bg-indigo-600' },
  technician: { label: 'Technician', badge: 'bg-violet-50 text-violet-700 ring-violet-600/20', dot: 'bg-violet-600' },
  user: { label: 'Fleet user', badge: 'bg-slate-100 text-slate-700 ring-slate-500/20', dot: 'bg-slate-500' },
};

/** Allowed transitions, mirroring the backend rules. Completed is locked. */
export const STATUS_TRANSITIONS: Record<ServiceStatus, ServiceStatus[]> = {
  pending: ['in-progress'],
  'in-progress': ['completed', 'pending'],
  completed: [],
};

/** Chart colours (hex) aligned with the status palette. */
export const CHART_COLORS = {
  accent: '#4f46e5',
  pending: '#d97706',
  inProgress: '#2563eb',
  completed: '#059669',
  overdue: '#dc2626',
  grid: '#e2e8f0',
  axis: '#64748b',
};

export const ROLE_HOME: Record<Role, string> = {
  admin: '/admin',
  technician: '/technician',
  user: '/dashboard',
};
