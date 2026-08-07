import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExerciseMedia } from '../../exercise-library/components/ExerciseMedia.js'
import { EXERCISE_SEARCH_DEBOUNCE_MS } from '../../exercise-library/constants/exercise-library.constants.js'
import { useDebouncedValue } from '../../exercise-library/hooks/useDebouncedValue.js'
import { useExerciseOptions } from '../../exercise-library/hooks/useExerciseOptions.js'
import { primaryMuscleLabel } from '../../exercise-library/utils/exercise-formatters.js'
import type { AiCoachSelectionState } from '../types/ai-coach.types.js'
import {
  AiCoachChoiceState,
  AiCoachPickerSearch,
  AiCoachSelectedSource,
} from './AiCoachPickerShared.js'

export function AiCoachExercisePicker({
  selection,
  onChange,
}: {
  selection: AiCoachSelectionState
  onChange: (selection: AiCoachSelectionState) => void
}) {
  const { t } = useTranslation('aiCoach')
  const [search, setSearch] = useState('')
  const resource = useExerciseOptions(
    useDebouncedValue(search, EXERCISE_SEARCH_DEBOUNCE_MS),
  )
  const selected =
    selection?.kind === 'source' && selection.sourceType === 'EXERCISE'
      ? selection
      : null
  const options = resource.state.status === 'success' ? resource.state.data : []
  return (
    <div>
      <AiCoachPickerSearch value={search} onChange={setSearch} />
      {selected ? (
        <AiCoachSelectedSource
          label={selected.label}
          onClear={() => {
            onChange(null)
          }}
        />
      ) : null}
      <AiCoachChoiceState
        status={resource.state.status}
        {...(resource.state.status === 'error'
          ? { errorMessage: resource.state.errorMessage }
          : {})}
        empty={options.length === 0}
        onRetry={resource.retry}
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              onChange({
                kind: 'source',
                sourceType: 'EXERCISE',
                sourceId: option.id,
                label: option.name,
              })
            }}
            className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-white/10 bg-black/15 p-2 text-start focus-visible:ring-2 focus-visible:ring-lime-300"
          >
            <ExerciseMedia
              src={option.thumbnailUrl}
              alt={t('selection.exerciseAlt', { name: option.name })}
              className="size-12 shrink-0 rounded-lg"
            />
            <span>
              <strong className="block">{option.name}</strong>
              <span className="text-xs text-zinc-400">
                {primaryMuscleLabel(option.primaryMuscle)}
              </span>
            </span>
          </button>
        ))}
      </AiCoachChoiceState>
    </div>
  )
}
