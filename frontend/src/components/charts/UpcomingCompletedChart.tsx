import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { StatsSummary } from '../../types';
import { CHART_COLORS } from '../../utils/status';
import { ChartCard } from './ChartCard';
import { ChartTooltip } from './ChartTooltip';

interface Props {
  data: StatsSummary['upcomingVsCompleted'];
  title?: string;
  className?: string;
}

export function UpcomingCompletedChart({ data, title = 'Upcoming vs completed', className }: Props) {
  const slices = [
    { name: 'Upcoming', value: data.upcoming, fill: CHART_COLORS.inProgress },
    { name: 'Completed', value: data.completed, fill: CHART_COLORS.completed },
  ];
  const total = data.upcoming + data.completed;

  return (
    <ChartCard
      title={title}
      description="Open services vs finished work"
      className={className}
      isEmpty={total === 0}
      table={{ columns: ['Group', 'Services'], rows: slices.map((s) => [s.name, s.value]) }}
    >
      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
              cy="45%"
            >
              {slices.map((s) => (
                <Cell key={s.name} fill={s.fill} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend
              iconType="square"
              iconSize={10}
              wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis }}
              formatter={(value: string, entry) => {
                const v = (entry.payload as { value?: number } | undefined)?.value ?? 0;
                return `${value} (${v})`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-x-0 top-[45%] -translate-y-1/2 text-center">
          <p className="text-2xl font-semibold tabular-nums text-slate-900">{total}</p>
          <p className="text-xs text-slate-500">services</p>
        </div>
      </div>
    </ChartCard>
  );
}
