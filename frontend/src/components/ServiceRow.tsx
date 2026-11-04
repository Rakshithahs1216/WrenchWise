import { CalendarDays, CheckCircle2, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Service } from '../types';
import { formatDate, isOverdue, serviceTypeLabel, vehicleLabel } from '../utils/format';
import { OverdueBadge, StatusBadge } from './Badge';

/** Compact read-only service summary used in the user's upcoming/history lists. */
export function ServiceRow({ service }: { service: Service }) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{serviceTypeLabel(service.serviceType)}</p>
        {service.vehicle ? (
          <Link
            to={`/vehicles/${service.vehicle.id}/timeline`}
            className="block truncate text-xs text-indigo-600 hover:underline"
          >
            {vehicleLabel(service.vehicle)}
          </Link>
        ) : (
          <p className="text-xs text-slate-500">{vehicleLabel(null)}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(service.scheduledDate)}
          </span>
          {service.completedAt && (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Done {formatDate(service.completedAt)}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {service.technician?.name ?? 'Unassigned'}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 gap-1.5">
        {isOverdue(service) && <OverdueBadge />}
        <StatusBadge status={service.status} />
      </div>
    </li>
  );
}
