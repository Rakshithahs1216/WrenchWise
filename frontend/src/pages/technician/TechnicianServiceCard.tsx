import { ArrowRight, CalendarDays, CheckCircle2, ChevronDown, Lock, Play, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OverdueBadge, StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ServiceNotes } from '../../components/ServiceNotes';
import { useUpdateServiceStatus } from '../../hooks/useServiceActions';
import type { Service, ServiceStatus } from '../../types';
import { formatDate, isOverdue, serviceTypeLabel, vehicleLabel } from '../../utils/format';
import { STATUS_TRANSITIONS } from '../../utils/status';

const TRANSITION_ACTIONS: Record<ServiceStatus, { label: string; icon: typeof Play; variant: 'primary' | 'secondary' }> = {
  'in-progress': { label: 'Start work', icon: Play, variant: 'primary' },
  completed: { label: 'Mark completed', icon: CheckCircle2, variant: 'primary' },
  pending: { label: 'Back to pending', icon: Undo2, variant: 'secondary' },
};

export function TechnicianServiceCard({ service }: { service: Service }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const updateStatus = useUpdateServiceStatus();
  const transitions = STATUS_TRANSITIONS[service.status];
  const overdue = isOverdue(service);

  return (
    <article className="card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{serviceTypeLabel(service.serviceType)}</h3>
          {service.vehicle ? (
            <Link
              to={`/vehicles/${service.vehicle.id}/timeline`}
              className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-xs text-indigo-600 hover:underline"
            >
              {vehicleLabel(service.vehicle)} <ArrowRight className="h-3 w-3 shrink-0" aria-hidden="true" />
            </Link>
          ) : (
            <p className="text-xs text-slate-500">{vehicleLabel(null)}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge status={service.status} />
          {overdue && <OverdueBadge />}
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
        Scheduled {formatDate(service.scheduledDate)}
      </p>
      {service.description && <p className="mt-2 text-sm text-slate-700">{service.description}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {transitions.length === 0 ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Completed {formatDate(service.completedAt)} · locked
          </span>
        ) : (
          transitions.map((next) => {
            const action = TRANSITION_ACTIONS[next];
            const Icon = action.icon;
            return (
              <Button
                key={next}
                size="sm"
                variant={action.variant}
                icon={<Icon className="h-3.5 w-3.5" />}
                disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id: service.id, status: next })}
              >
                {action.label}
              </Button>
            );
          })
        )}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setNotesOpen((o) => !o)}
          aria-expanded={notesOpen}
          className="flex w-full items-center justify-between text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          Notes ({service.notes.length})
          <ChevronDown className={`h-4 w-4 transition-transform ${notesOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        {notesOpen && (
          <div className="mt-3">
            <ServiceNotes service={service} canAdd />
          </div>
        )}
      </div>
    </article>
  );
}
