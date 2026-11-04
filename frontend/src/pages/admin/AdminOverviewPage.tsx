import { AlertTriangle, CarFront, CheckCircle2, ClipboardList, Clock, Loader } from 'lucide-react';
import { MonthlyServicesChart } from '../../components/charts/MonthlyServicesChart';
import { ServicesByTypeChart } from '../../components/charts/ServicesByTypeChart';
import { UpcomingCompletedChart } from '../../components/charts/UpcomingCompletedChart';
import { PageHeader } from '../../components/PageHeader';
import { QueryView } from '../../components/QueryView';
import { ChartSkeleton, StatTilesSkeleton } from '../../components/Skeleton';
import { StatTile } from '../../components/StatTile';
import { useSummary } from '../../hooks/queries';

export function AdminOverviewPage() {
  const query = useSummary();
  return (
    <div>
      <PageHeader title="Fleet overview" description="Maintenance activity across the whole fleet." />
      <QueryView
        query={query}
        loading={
          <div className="space-y-6">
            <StatTilesSkeleton />
            <ChartSkeleton />
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          </div>
        }
      >
        {({ totals, monthly, byType, upcomingVsCompleted }) => (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <StatTile label="Vehicles" value={totals.vehicles} icon={CarFront} tone="indigo" />
              <StatTile label="Total services" value={totals.services} icon={ClipboardList} tone="slate" />
              <StatTile label="Pending" value={totals.pending} icon={Clock} tone="amber" />
              <StatTile label="In progress" value={totals.inProgress} icon={Loader} tone="blue" />
              <StatTile label="Completed" value={totals.completed} icon={CheckCircle2} tone="emerald" />
              <StatTile label="Overdue" value={totals.overdue} icon={AlertTriangle} tone="red" hint="Past scheduled date" />
            </div>
            <MonthlyServicesChart data={monthly} description="Scheduled vs completed — last 12 months and next 3" />
            <div className="grid gap-6 lg:grid-cols-5">
              <ServicesByTypeChart data={byType} className="lg:col-span-3" />
              <UpcomingCompletedChart data={upcomingVsCompleted} className="lg:col-span-2" />
            </div>
          </div>
        )}
      </QueryView>
    </div>
  );
}
