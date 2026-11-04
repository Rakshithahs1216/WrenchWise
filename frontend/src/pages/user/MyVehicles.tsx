import { ArrowRight, CarFront, Gauge } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VehicleStatusBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { QueryView } from '../../components/QueryView';
import { Skeleton } from '../../components/Skeleton';
import { useMyVehicles } from '../../hooks/queries';

export function MyVehicles() {
  const query = useMyVehicles();
  return (
    <section aria-label="My vehicles">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">My vehicles</h2>
      <QueryView
        query={query}
        loading={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        }
        isEmpty={(list) => list.length === 0}
        empty={
          <EmptyState icon={CarFront} title="No vehicles assigned" description="Ask your fleet admin to assign a vehicle to you." />
        }
      >
        {(vehicles) => (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((v) => (
              <article key={v.id} className="card flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                      <CarFront className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900">
                        {v.make} {v.model}
                      </h3>
                      <p className="font-mono text-xs text-slate-500">{v.registrationNumber}</p>
                    </div>
                  </div>
                  <VehicleStatusBadge status={v.status} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-slate-500">Year</dt>
                    <dd className="font-medium text-slate-800">{v.year}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Mileage</dt>
                    <dd className="inline-flex items-center gap-1 font-medium text-slate-800">
                      <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
                      {v.mileage != null ? `${v.mileage.toLocaleString()} km` : '—'}
                    </dd>
                  </div>
                </dl>
                <Link
                  to={`/vehicles/${v.id}/timeline`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
                >
                  View service timeline <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </QueryView>
    </section>
  );
}
