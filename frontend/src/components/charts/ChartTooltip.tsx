import type { TooltipProps } from 'recharts';

type Props = TooltipProps<number, string> & { labelFormatter?: (label: string) => string };

/** Shared tooltip: neutral card, coloured key swatch, values in text ink. */
export function ChartTooltip({ active, payload, label, labelFormatter }: Props) {
  if (!active || !payload?.length) return null;
  const heading = label !== undefined ? (labelFormatter ? labelFormatter(String(label)) : String(label)) : null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      {heading && <p className="mb-1 font-semibold text-slate-900">{heading}</p>}
      <ul className="space-y-0.5">
        {payload.map((item) => (
          <li key={String(item.dataKey ?? item.name)} className="flex items-center gap-2 text-slate-600">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: item.color ?? (item.payload as { fill?: string } | undefined)?.fill }}
              aria-hidden="true"
            />
            <span>{item.name}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums text-slate-900">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
