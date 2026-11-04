import { ClipboardList, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { servicesApi } from '../../api/services';
import { OverdueBadge, StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { FilterBar } from '../../components/FilterBar';
import { PageHeader } from '../../components/PageHeader';
import { QueryView } from '../../components/QueryView';
import { RowActions, type RowAction } from '../../components/RowActions';
import { TableSkeleton } from '../../components/Skeleton';
import { useServices, useUsers, useVehicles } from '../../hooks/queries';
import { SERVICE_DEPENDENT_KEYS } from '../../hooks/queryKeys';
import { useApiMutation } from '../../hooks/useApiMutation';
import { SERVICE_STATUSES, type Service, type ServiceFilters, type ServiceStatus } from '../../types';
import { formatDate, isOverdue, serviceTypeLabel } from '../../utils/format';
import { SERVICE_STATUS_META } from '../../utils/status';
import { ServiceDetailModal } from './ServiceDetailModal';
import { ServiceFormModal } from './ServiceFormModal';

export function ServicesPage() {
  const [filters, setFilters] = useState<ServiceFilters>({ sort: '-scheduledDate' });
  const query = useServices(filters);
  const vehicles = useVehicles();
  const technicians = useUsers('technician');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);

  // Read the open service from the live list so notes refresh after a mutation.
  const detail = query.data?.find((s) => s.id === detailId) ?? null;

  const remove = useApiMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    invalidate: SERVICE_DEPENDENT_KEYS,
    successMessage: 'Service deleted',
    inlineError: true,
    onSuccess: () => setDeleting(null),
  });

  const setFilter = <K extends keyof ServiceFilters>(key: K, value: ServiceFilters[K] | '') =>
    setFilters((f) => ({ ...f, [key]: value || undefined }));

  const openForm = (service: Service | null) => {
    setEditing(service);
    setFormOpen(true);
  };

  const actionsFor = (s: Service): RowAction[] => [
    { label: 'View details', icon: Eye, onClick: () => setDetailId(s.id) },
    {
      label: 'Edit service',
      icon: Pencil,
      onClick: () => openForm(s),
      disabled: s.status === 'completed',
      title: s.status === 'completed' ? 'Completed services are locked' : undefined,
    },
    {
      label: 'Delete service',
      icon: Trash2,
      danger: true,
      onClick: () => {
        remove.reset();
        setDeleting(s);
      },
    },
  ];

  const filtered = Boolean(filters.status || filters.vehicle || filters.technician);

  return (
    <div>
      <PageHeader
        title="Services"
        description="Schedule maintenance and track every service record."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>
            Schedule service
          </Button>
        }
      />

      <FilterBar>
        <label className="lg:w-44">
          <span className="sr-only">Status</span>
          <select className="input" value={filters.status ?? ''} onChange={(e) => setFilter('status', e.target.value as ServiceStatus)}>
            <option value="">All statuses</option>
            {SERVICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {SERVICE_STATUS_META[s].label}
              </option>
            ))}
          </select>
        </label>
        <label className="lg:w-64">
          <span className="sr-only">Vehicle</span>
          <select className="input" value={filters.vehicle ?? ''} onChange={(e) => setFilter('vehicle', e.target.value)}>
            <option value="">All vehicles</option>
            {vehicles.data?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registrationNumber} · {v.make} {v.model}
              </option>
            ))}
          </select>
        </label>
        <label className="lg:w-52">
          <span className="sr-only">Technician</span>
          <select className="input" value={filters.technician ?? ''} onChange={(e) => setFilter('technician', e.target.value)}>
            <option value="">All technicians</option>
            {technicians.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="lg:w-44">
          <span className="sr-only">Sort</span>
          <select
            className="input"
            value={filters.sort}
            onChange={(e) => setFilter('sort', e.target.value as ServiceFilters['sort'])}
          >
            <option value="-scheduledDate">Newest date first</option>
            <option value="scheduledDate">Oldest date first</option>
          </select>
        </label>
        {filtered && (
          <Button variant="ghost" size="sm" onClick={() => setFilters({ sort: filters.sort })}>
            Clear filters
          </Button>
        )}
      </FilterBar>

      <QueryView
        query={query}
        loading={<TableSkeleton />}
        isEmpty={(list) => list.length === 0}
        empty={
          <EmptyState
            icon={ClipboardList}
            title={filtered ? 'No services match these filters' : 'No services scheduled'}
            description={filtered ? 'Try clearing a filter.' : 'Schedule the first service for your fleet.'}
          />
        }
      >
        {(services) => (
          <>
            <div className="card hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Scheduled</th>
                    <th className="px-4 py-3">Technician</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-mono font-medium text-slate-900">{s.vehicle?.registrationNumber ?? '—'}</p>
                        <p className="text-xs text-slate-500">{s.vehicle ? `${s.vehicle.make} ${s.vehicle.model}` : 'Deleted'}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{serviceTypeLabel(s.serviceType)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        <div className="flex flex-col items-start gap-1">
                          {formatDate(s.scheduledDate)}
                          {isOverdue(s) && <OverdueBadge />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.technician?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-2">
                        <RowActions actions={actionsFor(s)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-3 md:hidden">
              {services.map((s) => (
                <li key={s.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{serviceTypeLabel(s.serviceType)}</p>
                      <p className="truncate font-mono text-xs text-slate-500">{s.vehicle?.registrationNumber ?? 'Deleted vehicle'}</p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {formatDate(s.scheduledDate)} · {s.technician?.name ?? 'No technician'}
                    {isOverdue(s) && <OverdueBadge />}
                  </div>
                  <div className="mt-2">
                    <RowActions actions={actionsFor(s)} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </QueryView>

      <ServiceFormModal open={formOpen} service={editing} onClose={() => setFormOpen(false)} />
      <ServiceDetailModal service={detail} onClose={() => setDetailId(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete service"
        message={
          <>
            Delete the <strong>{deleting && serviceTypeLabel(deleting.serviceType).toLowerCase()}</strong> for{' '}
            <strong className="font-mono">{deleting?.vehicle?.registrationNumber}</strong>? Notes will be lost.
          </>
        }
        loading={remove.isPending}
        error={remove.error}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
