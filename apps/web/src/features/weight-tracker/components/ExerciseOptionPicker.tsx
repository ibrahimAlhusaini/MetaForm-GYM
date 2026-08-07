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

export function ExerciseOptionPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string
  onSelect: (option: ExerciseOption) => void
}) {
  const { t } = useTranslation('weightTracker')
  const [search, setSearch] = useState('')
  const [selectedOption, setSelectedOption] = useState<ExerciseOption | null>(
    null,
  )
  const options = useExerciseOptions(
    useDebouncedValue(search, EXERCISE_SEARCH_DEBOUNCE_MS),
  )
  return (
    <div className="mt-4">
      <label className="text-sm font-medium">
        {t('source.searchLibrary')}
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
            placeholder={t('source.searchPlaceholder')}
            className="min-h-11 w-full bg-transparent px-3 outline-none"
          />
        </span>
      </label>
      <ExerciseOptionResults
        selectedId={selectedId}
        resource={options}
        onSelect={(option) => {
          setSelectedOption(option)
          onSelect(option)
        }}
      />
      {selectedId && selectedOption ? (
        <p className="mt-3 text-sm text-lime-300">
          {t('source.selected', { name: selectedOption.name })}
        </p>
      ) : null}
    </div>
  )
}

function ExerciseOptionResults({
  selectedId,
  resource,
  onSelect,
}: {
  selectedId: string
  resource: ReturnType<typeof useExerciseOptions>
  onSelect: (option: ExerciseOption) => void
}) {
  const { t } = useTranslation(['weightTracker', 'common'])
  const { state } = resource
  return (
    <div
      className="mt-3"
      aria-live="polite"
      aria-busy={state.status === 'loading'}
    >
      {state.status === 'loading' ? (
        <p role="status" className="text-sm text-zinc-400">
          {t('weightTracker:loading.exerciseOptions')}
        </p>
      ) : null}
      {state.status === 'error' ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 text-sm text-red-200"
        >
          <span>{state.errorMessage}</span>
          <button
            type="button"
            onClick={resource.retry}
            className="font-semibold text-white underline"
          >
            {t('common:actions.retry')}
          </button>
        </div>
      ) : null}
      {state.status === 'success' && state.data.length === 0 ? (
        <p className="text-sm text-zinc-400">
          {t('weightTracker:source.noMatch')}
        </p>
      ) : null}
      {state.status === 'success' && state.data.length > 0 ? (
        <div
          role="listbox"
          aria-label={t('weightTracker:source.optionsLabel')}
          className="max-h-72 space-y-2 overflow-y-auto pe-1"
        >
          {state.data.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={selectedId === option.id}
              onClick={() => {
                onSelect(option)
              }}
              className={`flex min-h-16 w-full items-center gap-3 rounded-xl border p-2 text-start outline-none focus-visible:ring-2 focus-visible:ring-lime-300 ${selectedId === option.id ? 'border-lime-300/60 bg-lime-300/8' : 'border-white/10 bg-black/15'}`}
            >
              <ExerciseMedia
                src={option.thumbnailUrl}
                alt={t('weightTracker:source.optionAlt', { name: option.name })}
                className="size-12 shrink-0 rounded-lg"
              />
              <span className="min-w-0">
                <span className="block truncate font-semibold">
                  {option.name}
                </span>
                <span className="mt-1 block text-xs text-zinc-400">
                  {primaryMuscleLabel(option.primaryMuscle)} ·{' '}
                  {subgroupLabel(option.muscleSubgroup)} ·{' '}
                  {equipmentLabel(option.equipmentType)}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
