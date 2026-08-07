import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Scale } from 'lucide-react'
import type { DashboardSummaryData } from '@metaform/shared-types'
import { useTranslation } from 'react-i18next'
import {
  formatChartDate,
  formatCount,
  formatTrendDirection,
  formatWeight,
} from '../utils/dashboard-formatters.js'
import { SectionEmptyState } from './SectionEmptyState.js'
import { TrendSummary } from './TrendSummary.js'
import { WeightChartTooltip } from './WeightChartTooltip.js'

interface BodyWeightChartProps {
  progress: DashboardSummaryData['bodyWeightProgress']
}

export function BodyWeightChart({ progress }: BodyWeightChartProps) {
  const { t } = useTranslation(['dashboard', 'common'])
  const latestPoint = progress.points.at(-1)

  return (
    <section
      aria-labelledby="body-weight-title"
      className="mt-10 rounded-2xl border border-white/8 bg-[#111315] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="body-weight-title"
            className="text-xl font-semibold text-white"
          >
            {t('dashboard:bodyWeight.title')}
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            {t('dashboard:bodyWeight.description')}
          </p>
        </div>
        <TrendSummary
          direction={progress.trend.direction}
          changeKg={progress.trend.changeKg}
          percentageChange={progress.trend.percentageChange}
        />
      </div>

      {progress.points.length === 0 ? (
        <div className="mt-6">
          <SectionEmptyState
            icon={Scale}
            title={t('dashboard:bodyWeight.emptyTitle')}
            description={t('dashboard:bodyWeight.emptyDescription')}
          />
        </div>
      ) : (
        <>
          <p className="mt-5 text-sm text-zinc-400" aria-live="polite">
            {t('dashboard:bodyWeight.summary', {
              count: formatCount(progress.points.length, 'measurements'),
              value: latestPoint
                ? formatWeight(latestPoint.weightKg)
                : t('common:states.unavailable'),
              trend: formatTrendDirection(progress.trend.direction),
            })}
          </p>
          <div
            role="img"
            aria-label={t('dashboard:bodyWeight.chartLabel')}
            className="mt-5 h-72 min-w-0"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={progress.points}
                accessibilityLayer
                margin={{ top: 8, right: 10, bottom: 4, left: 0 }}
              >
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  minTickGap={24}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  tickFormatter={(value: number) => String(value)}
                  width={42}
                />
                <Tooltip
                  content={WeightChartTooltip}
                  cursor={{ stroke: 'rgba(217,249,75,0.25)' }}
                />
                <Line
                  type="linear"
                  dataKey="weightKg"
                  name={t('dashboard:bodyWeight.weightSeries')}
                  stroke="#d9f94b"
                  strokeWidth={2}
                  connectNulls={false}
                  isAnimationActive={false}
                  dot={{ r: 3, fill: '#d9f94b', strokeWidth: 0 }}
                  activeDot={{
                    r: 5,
                    fill: '#d9f94b',
                    stroke: '#111315',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  )
}
