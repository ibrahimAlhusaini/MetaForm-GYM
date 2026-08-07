import type { NutritionHistoryItem } from '@metaform/shared-types'
import { Clock3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AsyncState } from '../../weight-tracker/hooks/useAsyncResource.js'
import {
  formatCalories,
  formatDateTime,
  formatGoal,
  formatGrams,
  formatLiters,
} from '../utils/nutrition-formatters.js'
import {
  NutritionEmptyState,
  NutritionErrorState,
  NutritionSkeleton,
} from './NutritionStates.js'

export function LatestCalculationCard({
  state,
  onRetry,
}: {
  state: AsyncState<NutritionHistoryItem | null>
  onRetry: () => void
}) {
  const { t } = useTranslation(['nutrition', 'common'])
  if (state.status === 'loading')
    return <NutritionSkeleton label={t('nutrition:loading.latest')} />
  if (state.status === 'error')
    return (
      <NutritionErrorState
        title={t('nutrition:errors.latestTitle')}
        message={state.errorMessage}
        onRetry={onRetry}
      />
    )
  if (!state.data)
    return (
      <NutritionEmptyState
        title={t('nutrition:latest.emptyTitle')}
        description={t('nutrition:latest.emptyDescription')}
      />
    )

  const item = state.data
  return (
    <article className="rounded-2xl border border-white/10 bg-[#111315] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            {t('nutrition:latest.title')}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
            <Clock3 className="size-4" aria-hidden="true" />
            {formatDateTime(item.calculatedAt)}
          </p>
        </div>
        {item.inputs ? (
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
            {formatGoal(item.inputs.goal)}
          </span>
        ) : null}
      </div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <LatestMetric
          term={t('nutrition:latest.maintenance')}
          value={formatCalories(item.results.maintenanceCalories)}
        />
        <LatestMetric
          term={t('nutrition:latest.recommended')}
          value={
            item.results.recommendedCalories === null
              ? t('common:states.unavailable')
              : formatCalories(item.results.recommendedCalories)
          }
        />
        <LatestMetric
          term={t('nutrition:results.protein')}
          value={formatGrams(item.results.proteinGrams)}
        />
        <LatestMetric
          term={t('nutrition:results.carbs')}
          value={formatGrams(item.results.carbohydrateGrams)}
        />
        <LatestMetric
          term={t('nutrition:results.fat')}
          value={formatGrams(item.results.fatGrams)}
        />
        <LatestMetric
          term={t('nutrition:results.water')}
          value={formatLiters(item.results.waterLiters)}
        />
      </dl>
    </article>
  )
}

function LatestMetric({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-zinc-500 uppercase">{term}</dt>
      <dd className="mt-1 text-sm font-semibold text-zinc-100">{value}</dd>
    </div>
  )
}
