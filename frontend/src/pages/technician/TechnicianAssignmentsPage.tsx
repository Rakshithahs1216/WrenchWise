import { AlertTriangle, CheckCircle2, ClipboardList, Clock, Loader } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { QueryView } from '../../components/QueryView';
import { CardListSkeleton, StatTilesSkeleton } from '../../components/Skeleton';
import { StatTile } from '../../components/StatTile';
import { Tabs } from '../../components/Tabs';
import { useServices } from '../../hooks/queries';
import { useCurrentUser } from '../../hooks/useAuth';
import type { Service, ServiceStatus } from '../../types';
import { isOverdue } from '../../utils/format';
import { SERVICE_STATUS_META } from '../../utils/status';
import { TechnicianServiceCard } from './TechnicianServiceCard';

type TabValue = ServiceStatus | 'overdue';

function countBy(services: Service[]) {
  return {
    pending: services.filter((s) => s.status === 'pending').length,
    'in-progress': services.filter((s) => s.status === 'in-progress').length,
    completed: services.filter((s) => s.status === 'completed').length,
    overdue: services.filter(isOverdue).length,
  } satisfies Record<TabValue, number>;
}

export function TechnicianAssignmentsPage() {
  const user = useCurrentUser();
  // The backend scopes /services to the technician's own assignments.
  const query = useServices({ sort: 'scheduledDate' });
  const [tab, setTab] = useState<TabValue>('pending');
  const counts = useMemo(() => countBy(query.data ?? []), [query.data]);

  const visible = useMemo(() => {
    const list = query.data ?? [];
    return tab === 'overdue' ? list.filter(isOverdue) : list.filter((s) => s.status === tab);
  }, [query.data, tab]);

  return (
    <div>
      <PageHeader title="My Assignments" description={`Welcome back, ${user.name.split(' ')[0]}. Here is the work assigned to you.`} />
      <QueryView
        query={query}
        loading={
          <div className="space-y-6">
            <StatTilesSkeleton count={4} />
            <CardListSkeleton count={3} />
          </div>
        }
      >
        {(services) => (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Pending" value={counts.pending} icon={Clock} tone="amber" />
              <StatTile label="In progress" value={counts['in-progress']} icon={Loader} tone="blue" />
              <StatTile label="Completed" value={counts.completed} icon={CheckCircle2} tone="emerald" />
              <StatTile label="Overdue" value={counts.overdue} icon={AlertTriangle} tone="red" />
            </div>

            <Tabs<TabValue>
              label="Filter assignments by status"
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'pending', label: SERVICE_STATUS_META.pending.label, count: counts.pending },
                { value: 'in-progress', label: SERVICE_STATUS_META['in-progress'].label, count: counts['in-progress'] },
                { value: 'completed', label: SERVICE_STATUS_META.completed.label, count: counts.completed },
                { value: 'overdue', label: 'Overdue', count: counts.overdue },
              ]}
            />

            {services.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No assignments yet" description="Services assigned to you by an admin will show up here." />
            ) : visible.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Nothing here" description="No services match this filter." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visible.map((service) => (
                  <TechnicianServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
          </div>
        )}
      </QueryView>
    </div>
  );
}
