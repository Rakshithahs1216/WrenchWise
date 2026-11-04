import clsx from 'clsx';
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Role, ServiceStatus, VehicleStatus } from '../types';
import { OVERDUE_TONE, ROLE_META, SERVICE_STATUS_META, VEHICLE_STATUS_META } from '../utils/status';

export function Badge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ServiceStatus }) {
  const meta = SERVICE_STATUS_META[status];
  return (
    <Badge className={meta.badge}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

export function OverdueBadge() {
  return (
    <Badge className={OVERDUE_TONE.badge}>
      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
      {OVERDUE_TONE.label}
    </Badge>
  );
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const meta = VEHICLE_STATUS_META[status];
  return (
    <Badge className={meta.badge}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return <Badge className={ROLE_META[role].badge}>{ROLE_META[role].label}</Badge>;
}
