import { CarFront, History, Pencil, Plus, Search, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { vehiclesApi } from '../../api/vehicles';
import { VehicleStatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { FilterBar } from '../../components/FilterBar';
import { PageHeader } from '../../components/PageHeader';
import { QueryView } from '../../components/QueryView';
import { RowActions, type RowAction } from '../../components/RowActions';
import { TableSkeleton } from '../../components/Skeleton';
import { useVehicles } from '../../hooks/queries';
import { VEHICLE_DEPENDENT_KEYS } from '../../hooks/queryKeys';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { VEHICLE_STATUSES, type Vehicle, type VehicleStatus } from '../../types';
import { VEHICLE_STATUS_META } from '../../utils/status';
import { AssignVehicleModal } from './AssignVehicleModal';
import { VehicleFormModal } from './VehicleFormModal';

export function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<VehicleStatus | ''>('');
  const q = useDebouncedValue(search.trim());
  const query = useVehicles({ q: q || undefined, status: status || undefined });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [assigning, setAssigning] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);

  const remove = useApiMutation({
    mutationFn: (id: string) => vehiclesApi.remove(id),
    invalidate: VEHICLE_DEPENDENT_KEYS,
    successMessage: 'Vehicle deleted',
    inlineError: true,
    onSuccess: () => setDeleting(null),
  });

  const openForm = (vehicle: Vehicle | null) => {
    setEditing(vehicle);
    setFormOpen(true);
  };

  const actionsFor = (v: Vehicle): RowAction[] => [
    { label: 'View timeline', icon: History, to: `/vehicles/${v.id}/timeline` },
    { label: v.assignedUser ? 'Change assignment' : 'Assign to user', icon: UserPlus, onClick: () => setAssigning(v) },
    { label: 'Edit vehicle', icon: Pencil, onClick: () => openForm(v) },
    {
      label: 'Delete vehicle',
      icon: Trash2,
      danger: true,
      onClick: () => {
        remove.reset();
        setDeleting(v);
      },
    },
  ];

  const filtered = Boolean(q || status);

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Register fleet vehicles and assign them to drivers."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>
            Add vehicle
          </Button>
        }
      />

      <FilterBar>
        <label className="relative lg:w-72">
          <span className="sr-only">Search vehicles</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search registration, make, model"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="lg:w-48">
          <span className="sr-only">Filter by status</span>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as VehicleStatus | '')}>
            <option value="">All statuses</option>
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {VEHICLE_STATUS_META[s].label}
              </option>
            ))}
          </select>
        </label>
        {query.isFetching && !query.isPending && <span className="text-xs text-slate-400">Updating…</span>}
      </FilterBar>

      <QueryView
        query={query}
        loading={<TableSkeleton />}
        isEmpty={(list) => list.length === 0}
        empty={
          <EmptyState
            icon={CarFront}
            title={filtered ? 'No vehicles match your filters' : 'No vehicles yet'}
            description={filtered ? 'Try a different search or status.' : 'Add your first vehicle to get started.'}
          />
        }
      >
        {(vehicles) => (
          <>
            {/* Desktop table */}
            <div className="card hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Registration</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Mileage</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Assigned to</th>
                    <th className="px-4 py-3 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-medium text-slate-900">{v.registrationNumber}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {v.make} {v.model} <span className="text-slate-400">· {v.year}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600">
                        {v.mileage != null ? `${v.mileage.toLocaleString()} km` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <VehicleStatusBadge status={v.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {v.assignedUser?.name ?? <span className="text-slate-400">Unassigned</span>}
                      </td>
                      <td className="px-4 py-2">
                        <RowActions actions={actionsFor(v)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-3 md:hidden">
              {vehicles.map((v) => (
                <li key={v.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-slate-900">{v.registrationNumber}</p>
                      <p className="text-sm text-slate-600">
                        {v.make} {v.model} · {v.year}
                      </p>
                    </div>
                    <VehicleStatusBadge status={v.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-slate-500">
                      {v.assignedUser ? `Assigned to ${v.assignedUser.name}` : 'Unassigned'}
                    </p>
                    <RowActions actions={actionsFor(v)} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </QueryView>

      <VehicleFormModal open={formOpen} vehicle={editing} onClose={() => setFormOpen(false)} />
      <AssignVehicleModal vehicle={assigning} onClose={() => setAssigning(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete vehicle"
        message={
          <>
            Delete <strong className="font-mono">{deleting?.registrationNumber}</strong>? All of its service records will
            also be deleted. This cannot be undone.
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
