import type { NutritionCalculationRequest } from '@metaform/shared-types'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HealthDisclaimer } from '../components/HealthDisclaimer.js'
import { LatestCalculationCard } from '../components/LatestCalculationCard.js'
import { NutritionForm } from '../components/NutritionForm.js'
import { NutritionHistory } from '../components/NutritionHistory.js'
import {
  NutritionErrorState,
  NutritionSkeleton,
} from '../components/NutritionStates.js'
import { NutritionResults } from '../components/NutritionResults.js'
import { NUTRITION_HISTORY_LIMIT } from '../constants/nutrition.constants.js'
import { useLatestNutrition } from '../hooks/useLatestNutrition.js'
import { useNutritionCalculation } from '../hooks/useNutritionCalculation.js'
import { useNutritionHistory } from '../hooks/useNutritionHistory.js'
import { useNutritionProfileInputs } from '../hooks/useNutritionProfileInputs.js'
import type { NutritionDateFilters } from '../types/nutrition.types.js'
import { dateFiltersToQuery } from '../utils/nutrition-payload.js'

export function CaloriesCalculatorPage() {
  const { t } = useTranslation('nutrition')
  const [page, setPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [dateQuery, setDateQuery] = useState<{
    dateFrom?: string
    dateTo?: string
  }>({})
  const resultRegion = useRef<HTMLElement>(null)
  const profile = useNutritionProfileInputs()
  const calculation = useNutritionCalculation()
  const latest = useLatestNutrition()
  const historyQuery = useMemo(
    () => ({ page, limit: NUTRITION_HISTORY_LIMIT, sortOrder, ...dateQuery }),
    [dateQuery, page, sortOrder],
  )
  const history = useNutritionHistory(historyQuery)

  const calculate = async (input: NutritionCalculationRequest) => {
    const result = await calculation.submit(input)
    if (!result) return
    latest.retry()
    history.retry()
    requestAnimationFrame(() => resultRegion.current?.focus())
  }
  const applyDates = (filters: NutritionDateFilters) => {
    setPage(1)
    setDateQuery(dateFiltersToQuery(filters))
  }

  return (
    <div>
      <header>
        <p className="text-sm font-semibold tracking-[0.18em] text-lime-300 uppercase">
          {t('header.eyebrow')}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t('header.title')}
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-400">
          {t('header.description')}
        </p>
      </header>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section aria-label={t('regions.inputs')}>
          {profile.state.status === 'loading' ? (
            <NutritionSkeleton label={t('loading.profile')} />
          ) : null}
          {profile.state.status === 'error' ? (
            <NutritionErrorState
              title={t('errors.profileTitle')}
              message={profile.state.errorMessage}
              onRetry={profile.retry}
            />
          ) : null}
          {profile.state.status === 'success' ? (
            <NutritionForm
              profile={profile.state.data}
              pending={calculation.pending}
              errorMessage={calculation.errorMessage}
              onCalculate={calculate}
            />
          ) : null}
        </section>
        <section
          ref={resultRegion}
          tabIndex={-1}
          aria-label={t('regions.results')}
          aria-live="polite"
          className="scroll-mt-6 outline-none"
        >
          <NutritionResults result={calculation.result} />
        </section>
      </div>

      <div className="mt-8">
        <LatestCalculationCard state={latest.state} onRetry={latest.retry} />
      </div>
      <div className="mt-6">
        <NutritionHistory
          state={history.state}
          sortOrder={sortOrder}
          onSortChange={(order) => {
            setPage(1)
            setSortOrder(order)
          }}
          onApplyDates={applyDates}
          onPageChange={setPage}
          onRetry={history.retry}
        />
      </div>
      <div className="mt-6">
        <HealthDisclaimer />
      </div>
    </div>
  )
}
