import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EXERCISE_SEARCH_DEBOUNCE_MS } from '../../exercise-library/constants/exercise-library.constants.js'
import { useDebouncedValue } from '../../exercise-library/hooks/useDebouncedValue.js'
import { MachineImage } from '../../weight-tracker/components/MachineImage.js'
import { useMachines } from '../../weight-tracker/hooks/useMachines.js'
import { muscleLabel } from '../../../i18n/enum-labels.js'
import { AI_COACH_PICKER_LIMIT } from '../constants/ai-coach.constants.js'
import type { AiCoachSelectionState } from '../types/ai-coach.types.js'
import {
  AiCoachChoiceState,
  AiCoachPickerSearch,
  AiCoachSelectedSource,
} from './AiCoachPickerShared.js'

export function AiCoachMachinePicker({
  selection,
  onChange,
}: {
  selection: AiCoachSelectionState
  onChange: (selection: AiCoachSelectionState) => void
}) {
  const { t } = useTranslation('aiCoach')
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(
    search,
    EXERCISE_SEARCH_DEBOUNCE_MS,
  ).trim()
  const resource = useMachines({
    page: 1,
    limit: AI_COACH_PICKER_LIMIT,
    ...(debounced ? { search: debounced } : {}),
    sortBy: 'name',
    sortOrder: 'asc',
  })
  const selected =
    selection?.kind === 'source' && selection.sourceType === 'CUSTOM_MACHINE'
      ? selection
      : null
  const machines =
    resource.state.status === 'success' ? resource.state.data.items : []
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
        empty={machines.length === 0}
        onRetry={resource.retry}
      >
        {machines.map((machine) => (
          <button
            key={machine.id}
            type="button"
            onClick={() => {
              onChange({
                kind: 'source',
                sourceType: 'CUSTOM_MACHINE',
                sourceId: machine.id,
                label: machine.name,
              })
            }}
            className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-white/10 bg-black/15 p-2 text-start focus-visible:ring-2 focus-visible:ring-lime-300"
          >
            <MachineImage
              imageUrl={machine.imageUrl}
              name={machine.name}
              className="size-12 shrink-0 rounded-lg"
            />
            <span>
              <strong className="block">{machine.name}</strong>
              <span className="text-xs text-zinc-400">
                {muscleLabel(t, machine.targetMuscle)}
              </span>
            </span>
          </button>
        ))}
      </AiCoachChoiceState>
    </div>
  )
}
