import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EXERCISE_SEARCH_DEBOUNCE_MS } from '../../exercise-library/constants/exercise-library.constants.js'
import { useDebouncedValue } from '../../exercise-library/hooks/useDebouncedValue.js'
import { useWorkoutPlans } from '../../workout-plans/hooks/useWorkoutPlans.js'
import { planOwnershipLabel } from '../../workout-plans/utils/workout-plan-formatters.js'
import { difficultyLabel } from '../../../i18n/enum-labels.js'
import { AI_COACH_PICKER_LIMIT } from '../constants/ai-coach.constants.js'
import type { AiCoachSelectionState } from '../types/ai-coach.types.js'

export function AiCoachPlanPicker({
  selection,
  onChange,
}: {
  selection: AiCoachSelectionState
  onChange: (selection: AiCoachSelectionState) => void
}) {
  const { t } = useTranslation(['aiCoach', 'workoutPlans', 'common'])
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(
    search,
    EXERCISE_SEARCH_DEBOUNCE_MS,
  ).trim()
  const resource = useWorkoutPlans({
    page: 1,
    limit: AI_COACH_PICKER_LIMIT,
    ...(debounced ? { search: debounced } : {}),
    ownership: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  })
  const selected = selection?.kind === 'plan' ? selection : null
  return (
    <div>
      <label className="block text-sm font-medium">
        {t('aiCoach:selection.plan')}
        <span className="mt-2 flex rounded-xl border border-white/10 bg-[#151719] focus-within:border-lime-300">
          <Search
            className="ms-3 size-4 self-center text-zinc-500"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
            }}
            placeholder={t('aiCoach:selection.planPlaceholder')}
            className="min-h-11 w-full bg-transparent px-3 outline-none"
          />
        </span>
      </label>
      {selected ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-lime-300/30 bg-lime-300/5 px-3 py-2 text-sm">
          <span>
            {t('aiCoach:selection.selected', { name: selected.label })}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange(null)
            }}
            aria-label={t('aiCoach:selection.clear')}
            className="rounded-lg p-2 focus-visible:ring-2 focus-visible:ring-lime-300"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
      <div
        className="mt-3 max-h-72 space-y-2 overflow-y-auto"
        aria-live="polite"
        aria-busy={resource.state.status === 'loading'}
      >
        {resource.state.status === 'loading' ? (
          <p role="status" className="p-3 text-sm text-zinc-400">
            {t('aiCoach:selection.loadingPlans')}
          </p>
        ) : null}
        {resource.state.status === 'error' ? (
          <div role="alert" className="p-3 text-sm text-amber-100">
            {resource.state.errorMessage}
            <button
              type="button"
              onClick={resource.retry}
              className="ms-2 underline"
            >
              {t('common:actions.retry')}
            </button>
          </div>
        ) : null}
        {resource.state.status === 'success' &&
        resource.state.data.items.length === 0 ? (
          <p className="p-3 text-sm text-zinc-400">
            {t('aiCoach:selection.noPlans')}
          </p>
        ) : null}
        {resource.state.status === 'success'
          ? resource.state.data.items.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => {
                  onChange({
                    kind: 'plan',
                    workoutPlanId: plan.id,
                    label: plan.name,
                  })
                }}
                className="w-full rounded-xl border border-white/10 bg-black/15 p-3 text-start focus-visible:ring-2 focus-visible:ring-lime-300"
              >
                <strong className="block">{plan.name}</strong>
                <span className="mt-1 block text-xs text-zinc-400">
                  {difficultyLabel(t, plan.difficultyLevel)} ·{' '}
                  {planOwnershipLabel(t, plan)} ·{' '}
                  {t('aiCoach:selection.planDays', {
                    training: plan.trainingDays,
                    rest: plan.restDays,
                  })}
                </span>
              </button>
            ))
          : null}
      </div>
    </div>
  )
}
