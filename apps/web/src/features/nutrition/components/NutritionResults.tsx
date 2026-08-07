import type { NutritionCalculationData } from '@metaform/shared-types'
import { CheckCircle2, FlaskConical, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('nutrition')
  if (!result) {
    return (
      <NutritionEmptyState
        title={t('results.emptyTitle')}
        description={t('results.emptyDescription')}
      />
    )
  }

  const { results } = result
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111315] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-lime-300 uppercase">
            {t('results.eyebrow')}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{t('results.title')}</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {t('results.calculated', {
              date: formatDateTime(result.calculatedAt),
            })}
          </p>
        </div>
        <CheckCircle2 className="size-6 text-lime-300" aria-hidden="true" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <NutritionMetricCard
          label={t('results.recommendedCalories')}
          value={formatCalories(results.recommendedCalories)}
          featured
          note={t('results.recommendedNote')}
        />
        <NutritionMetricCard
          label={t('results.maintenance')}
          value={formatCalories(results.maintenanceCalories)}
        />
        <NutritionMetricCard
          label={t('results.bulking')}
          value={formatCalories(results.bulkingCalories)}
        />
        <NutritionMetricCard
          label={t('results.cutting')}
          value={formatCalories(results.cuttingCalories)}
        />
        <NutritionMetricCard
          label={t('results.bmr')}
          value={formatCalories(results.bmr)}
          note={t('results.bmrNote')}
        />
        <NutritionMetricCard
          label={t('results.tdee')}
          value={formatCalories(results.tdee)}
          note={t('results.tdeeNote')}
        />
      </div>

      <h3 className="mt-6 text-base font-semibold">
        {t('results.macrosTitle')}
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NutritionMetricCard
          label={t('results.protein')}
          value={formatGrams(results.proteinGrams)}
        />
        <NutritionMetricCard
          label={t('results.carbohydrates')}
          value={formatGrams(results.carbohydrateGrams)}
        />
        <NutritionMetricCard
          label={t('results.fat')}
          value={formatGrams(results.fatGrams)}
        />
        <NutritionMetricCard
          label={t('results.water')}
          value={formatLiters(results.waterLiters)}
        />
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-lg font-semibold">
            {t('results.bmi', { value: formatBmi(results.bmi) })}
          </span>
          <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-zinc-300">
            {formatBmiCategory(results.bmiCategory)}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {t('results.bmiNote')}
        </p>
      </div>

      <CalculationFlags
        safetyFloor={results.safetyFloorApplied}
        macroFallback={results.macroFallbackApplied}
      />

      <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 text-sm text-zinc-400 sm:grid-cols-2">
        <p className="flex items-center gap-2">
          <FlaskConical className="size-4 text-lime-300" aria-hidden="true" />{' '}
          {t('results.method', {
            method: formatBmrFormula(result.methodology.bmrFormula),
          })}
        </p>
        <p>
          {t('results.version', {
            version: result.methodology.calculationVersion,
          })}
        </p>
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
  const { t } = useTranslation('nutrition')
  if (!safetyFloor && !macroFallback) return null
  return (
    <div className="mt-4 space-y-2" aria-label={t('results.adjustments')}>
      {safetyFloor ? (
        <p className="flex gap-2 rounded-xl border border-white/10 p-3 text-sm text-zinc-300">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-lime-300"
            aria-hidden="true"
          />
          {t('results.safetyFloor')}
        </p>
      ) : null}
      {macroFallback ? (
        <p className="flex gap-2 rounded-xl border border-white/10 p-3 text-sm text-zinc-300">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-lime-300"
            aria-hidden="true"
          />
          {t('results.macroFallback')}
        </p>
      ) : null}
    </div>
  )
}
