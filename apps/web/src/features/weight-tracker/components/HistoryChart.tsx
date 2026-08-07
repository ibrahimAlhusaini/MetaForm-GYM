import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HistoryPoint } from '../types/weight-tracker.types.js'
import { useTranslation } from 'react-i18next'
import { formatDate, formatKg } from '../utils/formatters.js'

export function HistoryChart({
  points,
  sourceName,
}: {
  points: HistoryPoint[]
  sourceName: string
}) {
  const { t } = useTranslation('weightTracker')
  const chartData = points
    .filter(
      (point) => point.completedAt && point.representativeWeightKg !== null,
    )
    .map((point) => ({
      date: formatDate(point.completedAt ?? ''),
      weightKg: point.representativeWeightKg,
    }))
  const summary =
    chartData.length < 2
      ? t('history.singleSummary', {
          name: sourceName,
          count: chartData.length,
        })
      : t('history.summary', {
          name: sourceName,
          from: formatKg(chartData[0]?.weightKg ?? null),
          to: formatKg(chartData.at(-1)?.weightKg ?? null),
          count: chartData.length,
        })
  return (
    <section className="rounded-2xl border border-white/8 bg-[#111315] p-5">
      <h2 className="text-lg font-semibold">{t('history.chart')}</h2>
      <p className="mt-2 text-sm text-zinc-400" id="history-chart-summary">
        {summary}
      </p>
      <div
        className="mt-6 h-72"
        role="img"
        aria-labelledby="history-chart-summary"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
            <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} width={45} />
            <Tooltip
              contentStyle={{
                background: '#151719',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="weightKg"
              name={t('history.representativeWeight')}
              stroke="#d9f94b"
              strokeWidth={3}
              dot={{ r: 4, fill: '#d9f94b' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
