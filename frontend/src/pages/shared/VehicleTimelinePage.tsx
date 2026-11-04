import clsx from 'clsx';
import { ArrowLeft, CalendarClock, CalendarDays, CarFront, Gauge, User as UserIcon, Wrench } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OverdueBadge, StatusBadge, VehicleStatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { MonthlyServicesChart } from '../../components/charts/MonthlyServicesChart';
import { ServicesByTypeChart } from '../../components/charts/ServicesByTypeChart';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { QueryView } from '../../components/QueryView';
import { CardListSkeleton, ChartSkeleton } from '../../components/Skeleton';
import { useVehicleTimeline } from '../../hooks/queries';
import type { Service, StatsSummary } from '../../types';
import { formatDate, formatDateTime, isOverdue, monthKey, serviceTypeLabel } from '../../utils/format';
import { OVERDUE_TONE, SERVICE_STATUS_META } from '../../utils/status';

/** Scheduled counts bucket by scheduledDate and completed by completedAt, matching /stats/summary. */
function monthlyFrom(services: Service[]): StatsSummary['monthly'] {
  const buckets = new Map<string, { scheduled: number; completed: number }>();
  const bucketFor = (key: string) => {
    const bucket = buckets.get(key) ?? { scheduled: 0, completed: 0 };
    buckets.set(key, bucket);
    return bucket;
  };
  services.forEach((s) => {
    bucketFor(monthKey(s.scheduledDate)).scheduled += 1;
    if (s.status === 'completed' && s.completedAt) bucketFor(monthKey(s.completedAt)).completed += 1;
  });
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v }));
}

function byTypeFrom(services: Service[]): StatsSummary['byType'] {
  const counts = new Map<Service['serviceType'], number>();
  services.forEach((s) => counts.set(s.serviceType, (counts.get(s.serviceType) ?? 0) + 1));
  return [...counts.entries()].map(([serviceType, count]) => ({ serviceType, count }));
}

function TimelineItem({ service }: { service: Service }) {
  const overdue = isOverdue(service);
  const markerClass = overdue ? OVERDUE_TONE.dot : SERVICE_STATUS_META[service.status].dot;
  return (
    <li className="relative pb-8 pl-8 last:pb-0">
      <span className="absolute left-[7px] top-5 h-full w-px bg-slate-200" aria-hidden="true" />
      <span
        className={clsx('absolute left-0 top-1.5 h-4 w-4 rounded-full ring-4 ring-white', markerClass)}
        aria-hidden="true"
      />
      <div className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{serviceTypeLabel(service.serviceType)}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Scheduled {formatDate(service.scheduledDate)}
              {service.completedAt && <> · Completed {formatDate(service.completedAt)}</>}
            </p>
          </div>
          <div className="flex gap-1.5">
            {overdue && <OverdueBadge />}
            <StatusBadge status={service.status} />
          </div>
        </div>
        {service.description && <p className="mt-2 text-sm text-slate-700">{service.description}</p>}
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {service.technician?.name ?? 'No technician'}
        </p>
        {service.notes.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
            {service.notes.map((note) => (
              <li key={note.id} className="text-sm text-slate-700">
                <span className="whitespace-pre-wrap break-words">{note.text}</span>
                <span className="block text-xs text-slate-400">
                  {note.author?.name ?? 'Unknown'} · {formatDateTime(note.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function VehicleTimelinePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const query = useVehicleTimeline(id);
  const services = query.data?.services;
  const monthly = useMemo(() => monthlyFrom(services ?? []), [services]);
  const byType = useMemo(() => byTypeFrom(services ?? []), [services]);

  // Deep links have no in-app history to return to, so fall back to the role's home.
  const goBack = () => ((window.history.state as { idx?: number } | null)?.idx ? navigate(-1) : navigate('/'));

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2" icon={<ArrowLeft className="h-4 w-4" />} onClick={goBack}>
        Back
      </Button>
      <QueryView
        query={query}
        loading={
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
            <CardListSkeleton count={4} />
            <ChartSkeleton />
          </div>
        }
      >
        {({ vehicle, services: list }) => (
          <>
            <PageHeader
              title={`${vehicle.make} ${vehicle.model}`}
              description={
                <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1 font-mono font-medium text-slate-700">
                    <CarFront className="h-4 w-4" aria-hidden="true" />
                    {vehicle.registrationNumber}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-4 w-4" aria-hidden="true" />
                    {vehicle.year}
                  </span>
                  {vehicle.mileage != null && (
                    <span className="inline-flex items-center gap-1">
                      <Gauge className="h-4 w-4" aria-hidden="true" />
                      {vehicle.mileage.toLocaleString()} km
                    </span>
                  )}
                  <VehicleStatusBadge status={vehicle.status} />
                </span>
              }
            />
            <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,24rem)]">
              <section aria-label="Service timeline">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">Service timeline ({list.length})</h2>
                {list.length === 0 ? (
                  <EmptyState icon={Wrench} title="No services yet" description="This vehicle has no service records." />
                ) : (
                  <ol className="[&>li:last-child>span:first-child]:hidden">
                    {list.map((service) => (
                      <TimelineItem key={service.id} service={service} />
                    ))}
                  </ol>
                )}
              </section>
              <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
                <MonthlyServicesChart
                  data={monthly}
                  title="Services per month"
                  description="By scheduled month for this vehicle"
                />
                <ServicesByTypeChart data={byType} title="Service mix" />
              </aside>
            </div>
          </>
        )}
      </QueryView>
    </div>
  );
}
