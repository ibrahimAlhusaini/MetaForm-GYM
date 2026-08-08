import type {
  BodyMeasurementHistoryResponse,
  BodyWeightPredictionData,
} from '@metaform/shared-types'
import { RefreshCw, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface Props {
  state:
    | { status: 'loading'; data: null; errorMessage: null }
    | { status: 'error'; data: null; errorMessage: string }
    | {
        status: 'success'
        data: BodyMeasurementHistoryResponse['data']
        errorMessage: null
      }
  prediction: BodyWeightPredictionData | null
  onRetry: () => void
}

export function BodyWeightHistory({ state, prediction, onRetry }: Props) {
  const { t, i18n } = useTranslation('bodyWeight')
  const locale = i18n.language.startsWith('ar') ? 'ar-SA' : 'en-US'
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(
      new Date(value),
    )
  const measurements = state.status === 'success' ? state.data.items : []
  const chronological = [...measurements].reverse()
  const chartData = chronological.map((item) => ({
    date: item.measuredAt,
    observed: item.weightKg,
    forecast: null as number | null,
  }))
  const latest = chartData.at(-1)
  if (
    latest &&
    prediction?.status === 'AVAILABLE' &&
    prediction.predictedWeightKg !== null
  ) {
    latest.forecast = latest.observed
    chartData.push({
      date: prediction.targetDate,
      observed: Number.NaN,
      forecast: prediction.predictedWeightKg,
    })
  }

  return (
    <section
      aria-labelledby="body-weight-history-title"
      className="rounded-2xl border border-white/8 bg-[#111315] p-5 sm:p-6"
    >
      <h2 id="body-weight-history-title" className="text-xl font-semibold">
        {t('history.title')}
      </h2>
      {state.status === 'loading' ? (
        <p className="mt-5 text-zinc-400">{t('states.loadingHistory')}</p>
      ) : null}
      {state.status === 'error' ? (
        <div className="mt-5" role="alert">
          <p className="text-rose-300">{state.errorMessage}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 font-semibold text-lime-300"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            {t('actions.retry')}
          </button>
        </div>
      ) : null}
      {state.status === 'success' && measurements.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-white/10 p-5 text-zinc-400">
          <Scale className="size-5" aria-hidden="true" />
          <p className="mt-3 font-medium text-zinc-200">{t('history.empty')}</p>
          <p className="mt-1 text-sm">{t('history.emptyDescription')}</p>
        </div>
      ) : null}
      {state.status === 'success' && measurements.length > 0 ? (
        <>
          <p className="mt-4 text-sm text-zinc-400">
            {t('history.summary', {
              count: state.data.pagination.totalItems,
              latest: measurements[0]?.weightKg.toFixed(1),
            })}
          </p>
          <div
            dir="ltr"
            role="img"
            aria-label={t('history.chartLabel')}
            className="mt-5 h-64 min-w-0"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} accessibilityLayer>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis domain={['auto', 'auto']} width={42} />
                <Tooltip
                  labelFormatter={(value) =>
                    formatDate(
                      typeof value === 'string' || typeof value === 'number'
                        ? String(value)
                        : '',
                    )
                  }
                />
                <Line
                  dataKey="observed"
                  name={t('history.observed')}
                  stroke="#d9f94b"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="forecast"
                  name={t('history.forecast')}
                  stroke="#a78bfa"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  connectNulls
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ul
            className="mt-5 divide-y divide-white/8"
            aria-label={t('history.list')}
          >
            {measurements.slice(0, 8).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <time
                  dateTime={item.measuredAt}
                  className="text-sm text-zinc-400"
                >
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(item.measuredAt))}
                </time>
                <span
                  aria-label={t('a11y.recordedWeight', {
                    value: item.weightKg,
                  })}
                >
                  {item.weightKg.toFixed(1)} kg
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  )
}
