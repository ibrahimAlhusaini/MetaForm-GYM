import type { TooltipContentProps } from 'recharts'
import { formatChartDate, formatWeight } from '../utils/dashboard-formatters.js'

export function WeightChartTooltip({
  active,
  label,
  payload,
}: TooltipContentProps) {
  const rawValue = payload[0]?.value
  const value =
    typeof rawValue === 'number'
      ? rawValue
      : typeof rawValue === 'string'
        ? Number(rawValue)
        : null

  if (!active || value === null || !Number.isFinite(value)) {
    return null
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#17191b] px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-500">{formatChartDate(String(label))}</p>
      <p className="mt-1 font-semibold text-zinc-100">{formatWeight(value)}</p>
    </div>
  )
}
