import type { AiCoachSourceType } from '@metaform/shared-types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AiCoachSelectionState } from '../types/ai-coach.types.js'
import { AiCoachExercisePicker } from './AiCoachExercisePicker.js'
import { AiCoachMachinePicker } from './AiCoachMachinePicker.js'

export function AiCoachSourcePicker({
  selection,
  onChange,
}: {
  selection: AiCoachSelectionState
  onChange: (selection: AiCoachSelectionState) => void
}) {
  const { t } = useTranslation('aiCoach')
  const [sourceType, setSourceType] = useState<AiCoachSourceType>(
    selection?.kind === 'source' ? selection.sourceType : 'EXERCISE',
  )
  const changeType = (value: AiCoachSourceType) => {
    setSourceType(value)
    onChange(null)
  }
  return (
    <fieldset>
      <legend className="text-sm font-semibold">
        {t('selection.sourceType')}
      </legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {(['EXERCISE', 'CUSTOM_MACHINE'] as const).map((value) => (
          <label
            key={value}
            className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-medium ${sourceType === value ? 'border-lime-300/60 bg-lime-300/8' : 'border-white/10'}`}
          >
            <input
              type="radio"
              name="ai-source-type"
              value={value}
              checked={sourceType === value}
              onChange={() => {
                changeType(value)
              }}
              className="sr-only"
            />
            {t(`selection.sourceTypes.${value}`)}
          </label>
        ))}
      </div>
      {sourceType === 'EXERCISE' ? (
        <AiCoachExercisePicker selection={selection} onChange={onChange} />
      ) : (
        <AiCoachMachinePicker selection={selection} onChange={onChange} />
      )}
    </fieldset>
  )
}
