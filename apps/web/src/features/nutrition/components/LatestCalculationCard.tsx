import type { NutritionHistoryItem } from '@metaform/shared-types'
import { Clock3 } from 'lucide-react'
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
  if (state.status === 'loading')
    return <NutritionSkeleton label="Loading latest calculation" />
  if (state.status === 'error')
    return (
      <NutritionErrorState
        title="Latest calculation unavailable"
        message={state.errorMessage}
        onRetry={onRetry}
      />
    )
  if (!state.data)
    return (
      <NutritionEmptyState
        title="No calculation yet"
        description="Your most recent calculation will appear here after you calculate your targets."
      />
    )

  const item = state.data
  return (
    <article className="rounded-2xl border border-white/10 bg-[#111315] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Latest calculation</h2>
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
          term="Maintenance"
          value={formatCalories(item.results.maintenanceCalories)}
        />
        <LatestMetric
          term="Recommended"
          value={
            item.results.recommendedCalories === null
              ? 'Not available'
              : formatCalories(item.results.recommendedCalories)
          }
        />
        <LatestMetric
          term="Protein"
          value={formatGrams(item.results.proteinGrams)}
        />
        <LatestMetric
          term="Carbs"
          value={formatGrams(item.results.carbohydrateGrams)}
        />
        <LatestMetric term="Fat" value={formatGrams(item.results.fatGrams)} />
        <LatestMetric
          term="Water"
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
