import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { OverdueBadge, StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { ServiceNotes } from '../../components/ServiceNotes';
import type { Service } from '../../types';
import { formatDate, formatDateTime, isOverdue, serviceTypeLabel, vehicleLabel } from '../../utils/format';

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
    </div>
  );
}

export function ServiceDetailModal({ service, onClose }: { service: Service | null; onClose: () => void }) {
  return (
    <Modal
      open={Boolean(service)}
      onClose={onClose}
      variant="drawer"
      title={service ? serviceTypeLabel(service.serviceType) : ''}
      description={service ? vehicleLabel(service.vehicle) : undefined}
    >
      {service && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={service.status} />
            {isOverdue(service) && <OverdueBadge />}
          </div>
          <dl className="grid grid-cols-2 gap-4">
            <Detail label="Scheduled">{formatDate(service.scheduledDate)}</Detail>
            <Detail label="Technician">{service.technician?.name ?? 'Unassigned'}</Detail>
            <Detail label="Started">{formatDateTime(service.startedAt)}</Detail>
            <Detail label="Completed">{formatDateTime(service.completedAt)}</Detail>
            <div className="col-span-2">
              <Detail label="Description">{service.description || <span className="text-slate-400">No description</span>}</Detail>
            </div>
            {service.vehicle && (
              <div className="col-span-2">
                <Link to={`/vehicles/${service.vehicle.id}/timeline`} className="text-sm font-medium text-indigo-600 hover:underline">
                  View vehicle timeline →
                </Link>
              </div>
            )}
          </dl>
          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Notes ({service.notes.length})</h3>
            <ServiceNotes service={service} canAdd />
          </section>
        </div>
      )}
    </Modal>
  );
}
