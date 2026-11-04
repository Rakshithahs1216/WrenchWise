import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { StatsSummary } from '../../types';
import { formatMonth } from '../../utils/format';
import { CHART_COLORS } from '../../utils/status';
import { ChartCard } from './ChartCard';
import { ChartTooltip } from './ChartTooltip';

interface Props {
  data: StatsSummary['monthly'];
  title?: string;
  description?: string;
  className?: string;
}

export function MonthlyServicesChart({
  data,
  title = 'Monthly service frequency',
  description = 'Services scheduled vs completed per month',
  className,
}: Props) {
  const isEmpty = data.every((d) => d.scheduled === 0 && d.completed === 0);
  return (
    <ChartCard
      title={title}
      description={description}
      className={className}
      isEmpty={isEmpty}
      table={{
        columns: ['Month', 'Scheduled', 'Completed'],
        rows: data.map((d) => [formatMonth(d.month), d.scheduled, d.completed]),
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2} barCategoryGap="24%">
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
            interval="preserveStartEnd"
            minTickGap={8}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            content={<ChartTooltip labelFormatter={formatMonth} />}
          />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axis }} />
          <Bar dataKey="scheduled" name="Scheduled" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Bar dataKey="completed" name="Completed" fill={CHART_COLORS.completed} radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
