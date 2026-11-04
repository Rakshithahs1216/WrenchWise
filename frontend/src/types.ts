export type Role = 'admin' | 'technician' | 'user';

export const ROLES: Role[] = ['admin', 'technician', 'user'];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface UserRef {
  id: string;
  name: string;
  email: string;
}

export type VehicleStatus = 'active' | 'in-service' | 'retired';

export const VEHICLE_STATUSES: VehicleStatus[] = ['active', 'in-service', 'retired'];

export interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  vin?: string | null;
  mileage?: number | null;
  status: VehicleStatus;
  assignedUser: UserRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleRef {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
}

export type ServiceType =
  | 'oil-change'
  | 'tire-rotation'
  | 'brake-inspection'
  | 'battery-check'
  | 'engine-diagnostics'
  | 'transmission-service'
  | 'general-inspection'
  | 'other';

export const SERVICE_TYPES: ServiceType[] = [
  'oil-change',
  'tire-rotation',
  'brake-inspection',
  'battery-check',
  'engine-diagnostics',
  'transmission-service',
  'general-inspection',
  'other',
];

export type ServiceStatus = 'pending' | 'in-progress' | 'completed';

export const SERVICE_STATUSES: ServiceStatus[] = ['pending', 'in-progress', 'completed'];

export interface ServiceNote {
  id: string;
  text: string;
  author: { id: string; name: string } | null;
  createdAt: string;
}

export interface Service {
  id: string;
  vehicle: VehicleRef | null;
  serviceType: ServiceType;
  description?: string | null;
  scheduledDate: string;
  status: ServiceStatus;
  technician: UserRef | null;
  notes: ServiceNote[];
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StatsSummary {
  totals: {
    vehicles: number;
    services: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  byType: { serviceType: ServiceType; count: number }[];
  monthly: { month: string; scheduled: number; completed: number }[];
  upcomingVsCompleted: { upcoming: number; completed: number };
}

export interface VehicleTimeline {
  vehicle: Vehicle;
  services: Service[];
}

export interface FieldIssue {
  path: string;
  message: string;
}

// ---- Request payloads ----

export interface LoginInput {
  email: string;
  password: string;
}

export interface UserInput {
  name: string;
  email: string;
  password?: string;
  role: Role;
}

export interface VehicleInput {
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  vin?: string | null;
  mileage?: number;
  status?: VehicleStatus;
  assignedUser?: string | null;
}

export interface ServiceInput {
  vehicle: string;
  serviceType: ServiceType;
  scheduledDate: string;
  technician: string;
  description?: string;
}

export interface ServiceFilters {
  status?: ServiceStatus;
  vehicle?: string;
  technician?: string;
  from?: string;
  to?: string;
  sort?: 'scheduledDate' | '-scheduledDate';
}

export interface VehicleFilters {
  status?: VehicleStatus;
  assignedUser?: string;
  q?: string;
}

export type MyServicesScope = 'upcoming' | 'history' | 'all';
