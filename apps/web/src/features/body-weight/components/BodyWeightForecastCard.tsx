import type { BodyWeightPredictionData } from '@metaform/shared-types'
import { AlertTriangle, Beaker, RefreshCw, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  state:
    | { status: 'loading'; data: null; errorMessage: null }
    | { status: 'error'; data: null; errorMessage: string }
    | { status: 'success'; data: BodyWeightPredictionData; errorMessage: null }
  onRetry: () => void
}

const fixed = (value: number): string => value.toFixed(1)

export function BodyWeightForecastCard({ state, onRetry }: Props) {
  const { t } = useTranslation('bodyWeight')
  return (
    <section
      aria-labelledby="body-weight-forecast-title"
      aria-live="polite"
      className="rounded-2xl border border-lime-300/20 bg-gradient-to-br from-lime-300/8 to-[#111315] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-lime-300">
            <Beaker className="size-4" aria-hidden="true" />
            {t('preview.badge')}
          </p>
          <h2
            id="body-weight-forecast-title"
            className="mt-2 text-xl font-semibold"
          >
            {t('preview.title')}
          </h2>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
          {t('preview.horizon')}
        </span>
      </div>

      {state.status === 'loading' ? (
        <p className="mt-6 text-zinc-300">{t('states.calculating')}</p>
      ) : null}
      {state.status === 'error' ? (
        <div className="mt-6" role="alert">
          <p className="inline-flex items-center gap-2 text-amber-200">
            <AlertTriangle className="size-5" aria-hidden="true" />
            {state.errorMessage}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 font-semibold"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            {t('actions.retry')}
          </button>
        </div>
      ) : null}
      {state.status === 'success' && state.data.status === 'AVAILABLE' ? (
        <div className="mt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-zinc-500">{t('metrics.current')}</p>
              <p className="mt-1 text-2xl font-semibold">
                {fixed(state.data.currentWeightKg ?? 0)} kg
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">{t('metrics.estimated')}</p>
              <p
                className="mt-1 text-2xl font-semibold text-lime-200"
                aria-label={t('a11y.estimatedWeight', {
                  value: fixed(state.data.predictedWeightKg ?? 0),
                })}
              >
                {fixed(state.data.predictedWeightKg ?? 0)} kg
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">{t('metrics.change')}</p>
              <p className="mt-1 text-2xl font-semibold">
                {(state.data.expectedChangeKg ?? 0) > 0 ? '+' : ''}
                {fixed(state.data.expectedChangeKg ?? 0)} kg
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
            <p>
              {t('metrics.basedOn', {
                count: state.data.reliability.priorMeasurementCount + 1,
              })}
            </p>
            <p>
              {state.data.reliability.recentCadenceDays === null
                ? t('metrics.cadenceUnavailable')
                : t('metrics.cadence', {
                    days: fixed(state.data.reliability.recentCadenceDays),
                  })}
            </p>
          </div>
          <p className="mt-5 flex items-start gap-2 text-sm text-zinc-400">
            <TrendingUp className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {t('preview.explanation')}
          </p>
        </div>
      ) : null}
      {state.status === 'success' && state.data.status === 'ABSTAINED' ? (
        <div className="mt-6" role="status">
          <p className="font-semibold">{t('states.abstainedTitle')}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {t(
              `reasons.${state.data.reliability.reasonCodes[0] ?? 'INTERNAL_PREDICTION_UNAVAILABLE'}`,
            )}
          </p>
        </div>
      ) : null}

      <div className="mt-6 border-t border-white/8 pt-5 text-sm leading-6 text-zinc-400">
        <p>{t('preview.intervalUnavailable')}</p>
        <p className="mt-2">{t('preview.disclaimer')}</p>
        <p className="mt-2 font-medium text-zinc-300">{t('preview.medical')}</p>
      </div>
    </section>
  )
}
