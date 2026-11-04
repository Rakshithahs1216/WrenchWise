import { AlertTriangle, CalendarClock, CarFront, CheckCircle2, History } from 'lucide-react';
import { MonthlyServicesChart } from '../../components/charts/MonthlyServicesChart';
import { UpcomingCompletedChart } from '../../components/charts/UpcomingCompletedChart';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { QueryView } from '../../components/QueryView';
import { ServiceRow } from '../../components/ServiceRow';
import { CardListSkeleton, ChartSkeleton, StatTilesSkeleton } from '../../components/Skeleton';
import { StatTile } from '../../components/StatTile';
import { useMyServices, useSummary } from '../../hooks/queries';
import { useCurrentUser } from '../../hooks/useAuth';
import type { MyServicesScope } from '../../types';
import { MyVehicles } from './MyVehicles';

function ServiceList({ scope, title, emptyText }: { scope: MyServicesScope; title: string; emptyText: string }) {
  const query = useMyServices(scope);
  const Icon = scope === 'history' ? History : CalendarClock;
  return (
    <section aria-label={title}>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" /> {title}
        {query.data && <span className="text-slate-400">({query.data.length})</span>}
      </h2>
      <QueryView
        query={query}
        loading={<CardListSkeleton count={2} />}
        isEmpty={(list) => list.length === 0}
        empty={<EmptyState icon={Icon} title={emptyText} />}
      >
        {(services) => (
          <ul className="card max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
            {services.map((s) => (
              <ServiceRow key={s.id} service={s} />
            ))}
          </ul>
        )}
      </QueryView>
    </section>
  );
}

export function UserDashboardPage() {
  const user = useCurrentUser();
  const summary = useSummary();

  return (
    <div className="space-y-8">
      <PageHeader title="My Fleet" description={`Hi ${user.name.split(' ')[0]}, here is the status of your vehicles.`} />

      <QueryView query={summary} loading={<StatTilesSkeleton count={4} />}>
        {({ totals, upcomingVsCompleted }) => (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="My vehicles" value={totals.vehicles} icon={CarFront} tone="indigo" />
            <StatTile label="Upcoming" value={upcomingVsCompleted.upcoming} icon={CalendarClock} tone="blue" />
            <StatTile label="Completed" value={totals.completed} icon={CheckCircle2} tone="emerald" />
            <StatTile label="Overdue" value={totals.overdue} icon={AlertTriangle} tone="red" />
          </div>
        )}
      </QueryView>

      <MyVehicles />

      <div className="grid gap-6 lg:grid-cols-2">
        <ServiceList scope="upcoming" title="Upcoming services" emptyText="No upcoming services" />
        <ServiceList scope="history" title="Service history" emptyText="No completed services yet" />
      </div>

      <QueryView
        query={summary}
        loading={
          <div className="grid gap-6 lg:grid-cols-3">
            <ChartSkeleton />
            <ChartSkeleton className="lg:col-span-2" />
          </div>
        }
      >
        {(data) => (
          <div className="grid gap-6 lg:grid-cols-3">
            <UpcomingCompletedChart data={data.upcomingVsCompleted} />
            <MonthlyServicesChart data={data.monthly} className="lg:col-span-2" />
          </div>
        )}
      </QueryView>
    </div>
  );
}
