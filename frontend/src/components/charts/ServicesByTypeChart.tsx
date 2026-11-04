import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { StatsSummary } from '../../types';
import { serviceTypeLabel } from '../../utils/format';
import { CHART_COLORS } from '../../utils/status';
import { ChartCard } from './ChartCard';
import { ChartTooltip } from './ChartTooltip';

interface Props {
  data: StatsSummary['byType'];
  title?: string;
  className?: string;
}

export function ServicesByTypeChart({ data, title = 'Services by type', className }: Props) {
  const rows = [...data]
    .sort((a, b) => b.count - a.count)
    .map((d) => ({ label: serviceTypeLabel(d.serviceType), count: d.count }));

  return (
    <ChartCard
      title={title}
      description="Number of services per category"
      className={className}
      isEmpty={rows.length === 0}
      table={{ columns: ['Type', 'Services'], rows: rows.map((r) => [r.label, r.count]) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 28, left: 0, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={128}
            tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip />} />
          <Bar dataKey="count" name="Services" fill={CHART_COLORS.accent} radius={[0, 4, 4, 0]} maxBarSize={20}>
            <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: '#334155' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
