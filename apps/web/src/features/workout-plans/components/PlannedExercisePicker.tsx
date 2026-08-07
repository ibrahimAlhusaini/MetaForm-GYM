import type { ExerciseOption } from '@metaform/shared-types'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExerciseMedia } from '../../exercise-library/components/ExerciseMedia.js'
import { EXERCISE_SEARCH_DEBOUNCE_MS } from '../../exercise-library/constants/exercise-library.constants.js'
import { useDebouncedValue } from '../../exercise-library/hooks/useDebouncedValue.js'
import { useExerciseOptions } from '../../exercise-library/hooks/useExerciseOptions.js'
import {
  equipmentLabel,
  primaryMuscleLabel,
  subgroupLabel,
} from '../../exercise-library/utils/exercise-formatters.js'

export function PlannedExercisePicker({
  onSelect,
}: {
  onSelect: (option: ExerciseOption) => void
}) {
  const { t } = useTranslation(['workoutPlans', 'common'])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, EXERCISE_SEARCH_DEBOUNCE_MS)
  const options = useExerciseOptions(debouncedSearch)

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">
          {t('workoutPlans:builder.searchExercises')}
        </span>
        <Search
          className="pointer-events-none absolute start-3 top-3.5 size-4 text-zinc-500"
          aria-hidden="true"
        />
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
          }}
          placeholder={t('workoutPlans:builder.searchExercises')}
          className="min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] ps-10 pe-3"
        />
      </label>
      <div
        className="mt-2"
        aria-live="polite"
        aria-busy={options.state.status === 'loading'}
      >
        {options.state.status === 'loading' ? (
          <p role="status" className="p-3 text-sm text-zinc-400">
            {t('workoutPlans:builder.exerciseOptionsLoading')}
          </p>
        ) : null}
        {options.state.status === 'error' ? (
          <div role="alert" className="flex flex-wrap gap-3 p-3 text-sm">
            <span className="text-red-200">{options.state.errorMessage}</span>
            <button
              type="button"
              onClick={options.retry}
              className="font-semibold text-white underline"
            >
              {t('common:actions.retry')}
            </button>
          </div>
        ) : null}
        {options.state.status === 'success' &&
        options.state.data.length === 0 ? (
          <p className="p-3 text-sm text-zinc-500">
            {t('workoutPlans:builder.noExerciseMatches')}
          </p>
        ) : null}
        {options.state.status === 'success' && options.state.data.length > 0 ? (
          <ul
            aria-label={t('workoutPlans:builder.chooseExercise')}
            className="max-h-64 space-y-2 overflow-y-auto pe-1"
          >
            {options.state.data.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(option)
                  }}
                  className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-white/10 bg-black/15 p-2 text-start outline-none hover:border-lime-300/30 focus-visible:ring-2 focus-visible:ring-lime-300"
                >
                  <ExerciseMedia
                    src={option.thumbnailUrl}
                    alt={t('workoutPlans:builder.exerciseOptionAlt', {
                      name: option.name,
                    })}
                    className="size-12 shrink-0 rounded-lg"
                  />
                  <span className="min-w-0">
                    <strong className="block truncate">{option.name}</strong>
                    <span className="mt-1 block text-xs text-zinc-400">
                      {primaryMuscleLabel(option.primaryMuscle)} ·{' '}
                      {subgroupLabel(option.muscleSubgroup)} ·{' '}
                      {equipmentLabel(option.equipmentType)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
