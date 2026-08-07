import type { NutritionCalculationData } from '@metaform/shared-types'
import { CheckCircle2, FlaskConical, ShieldCheck } from 'lucide-react'
import { BMI_SCREENING_NOTE } from '../constants/nutrition.constants.js'
import {
  formatBmi,
  formatBmiCategory,
  formatBmrFormula,
  formatCalories,
  formatDateTime,
  formatGrams,
  formatLiters,
} from '../utils/nutrition-formatters.js'
import { NutritionMetricCard } from './NutritionMetricCard.js'
import { NutritionEmptyState } from './NutritionStates.js'

export function NutritionResults({
  result,
}: {
  result: NutritionCalculationData | null
}) {
  if (!result) {
    return (
      <NutritionEmptyState
        title="Your result will appear here"
        description="Complete the calculator to see estimates returned by the nutrition service."
      />
    )
  }

  const { results } = result
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111315] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-lime-300 uppercase">
            Your estimate
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Daily nutrition targets
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Calculated {formatDateTime(result.calculatedAt)}
          </p>
        </div>
        <CheckCircle2 className="size-6 text-lime-300" aria-hidden="true" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <NutritionMetricCard
          label="Recommended calories"
          value={formatCalories(results.recommendedCalories)}
          featured
          note="Your goal-adjusted target"
        />
        <NutritionMetricCard
          label="Maintenance calories"
          value={formatCalories(results.maintenanceCalories)}
        />
        <NutritionMetricCard
          label="Bulking calories"
          value={formatCalories(results.bulkingCalories)}
        />
        <NutritionMetricCard
          label="Cutting calories"
          value={formatCalories(results.cuttingCalories)}
        />
        <NutritionMetricCard
          label="BMR"
          value={formatCalories(results.bmr)}
          note="Basal metabolic rate estimate"
        />
        <NutritionMetricCard
          label="TDEE"
          value={formatCalories(results.tdee)}
          note="Total daily energy expenditure estimate"
        />
      </div>

      <h3 className="mt-6 text-base font-semibold">
        Macronutrients and hydration
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NutritionMetricCard
          label="Protein"
          value={formatGrams(results.proteinGrams)}
        />
        <NutritionMetricCard
          label="Carbohydrates"
          value={formatGrams(results.carbohydrateGrams)}
        />
        <NutritionMetricCard
          label="Fat"
          value={formatGrams(results.fatGrams)}
        />
        <NutritionMetricCard
          label="Water"
          value={formatLiters(results.waterLiters)}
        />
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-lg font-semibold">
            BMI {formatBmi(results.bmi)}
          </span>
          <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-300">
            {formatBmiCategory(results.bmiCategory)}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {BMI_SCREENING_NOTE}
        </p>
      </div>

      <CalculationFlags
        safetyFloor={results.safetyFloorApplied}
        macroFallback={results.macroFallbackApplied}
      />

      <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 text-sm text-zinc-400 sm:grid-cols-2">
        <p className="flex items-center gap-2">
          <FlaskConical className="size-4 text-lime-300" aria-hidden="true" />{' '}
          Method: {formatBmrFormula(result.methodology.bmrFormula)}
        </p>
        <p>Calculation version: {result.methodology.calculationVersion}</p>
      </div>
      <p className="mt-4 text-sm leading-6 text-zinc-400">
        {result.disclaimer}
      </p>
    </div>
  )
}

function CalculationFlags({
  safetyFloor,
  macroFallback,
}: {
  safetyFloor: boolean
  macroFallback: boolean
}) {
  if (!safetyFloor && !macroFallback) return null
  return (
    <div className="mt-4 space-y-2" aria-label="Calculation adjustments">
      {safetyFloor ? (
        <p className="flex gap-2 rounded-xl border border-white/10 p-3 text-sm text-zinc-300">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-lime-300"
            aria-hidden="true"
          />
          A safety calorie floor was applied by the nutrition service.
        </p>
      ) : null}
      {macroFallback ? (
        <p className="flex gap-2 rounded-xl border border-white/10 p-3 text-sm text-zinc-300">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-lime-300"
            aria-hidden="true"
          />
          A macro fallback strategy was applied by the nutrition service.
        </p>
      ) : null}
    </div>
  )
}
