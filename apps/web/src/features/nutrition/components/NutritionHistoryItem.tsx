import type { NutritionHistoryItem as NutritionHistoryRecord } from '@metaform/shared-types'
import {
  formatCalories,
  formatDateTime,
  formatGoal,
  formatGrams,
  formatLiters,
  formatWeight,
} from '../utils/nutrition-formatters.js'

export function NutritionHistoryItem({
  item,
}: {
  item: NutritionHistoryRecord
}) {
  const recommended = item.results.recommendedCalories
  return (
    <article className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{formatDateTime(item.calculatedAt)}</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {item.inputs
              ? `${formatWeight(item.inputs.weightKg)} · ${formatGoal(item.inputs.goal)}`
              : 'Historical input context not available'}
          </p>
        </div>
        <span className="text-xs text-zinc-500">
          Version {item.methodology?.calculationVersion ?? 'not available'}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 lg:grid-cols-7">
        <HistoryMetric
          term="Maintenance"
          value={formatCalories(item.results.maintenanceCalories)}
        />
        <HistoryMetric
          term="Recommended"
          value={
            recommended === null ? 'Not available' : formatCalories(recommended)
          }
        />
        <HistoryMetric
          term="Protein"
          value={formatGrams(item.results.proteinGrams)}
        />
        <HistoryMetric
          term="Carbs"
          value={formatGrams(item.results.carbohydrateGrams)}
        />
        <HistoryMetric term="Fat" value={formatGrams(item.results.fatGrams)} />
        <HistoryMetric
          term="Water"
          value={formatLiters(item.results.waterLiters)}
        />
        <HistoryMetric
          term="Goal"
          value={item.inputs ? formatGoal(item.inputs.goal) : 'Not available'}
        />
      </dl>
    </article>
  )
}

function HistoryMetric({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{term}</dt>
      <dd className="mt-1 text-sm font-medium text-zinc-200">{value}</dd>
    </div>
  )
}
