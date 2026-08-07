import { Library, Settings2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { EntryDraft, Machine } from '../types/weight-tracker.types.js'
import { ExerciseOptionPicker } from './ExerciseOptionPicker.js'

export function ExerciseSourceSelector({
  entry,
  machines,
  onChange,
}: {
  entry: EntryDraft
  machines: Machine[]
  onChange: (entry: EntryDraft) => void
}) {
  const { t } = useTranslation('weightTracker')
  const selectType = (sourceType: EntryDraft['sourceType']) => {
    onChange({
      ...entry,
      sourceType,
      exerciseId: sourceType === 'exercise' ? entry.exerciseId : '',
      customMachineId: sourceType === 'machine' ? entry.customMachineId : '',
    })
  }
  return (
    <div>
      <fieldset>
        <legend className="text-sm font-medium">{t('source.label')}</legend>
        <div
          role="radiogroup"
          aria-label={t('source.label')}
          className="mt-2 grid gap-2 sm:grid-cols-2"
        >
          <SourceTypeButton
            active={entry.sourceType === 'exercise'}
            label={t('source.library')}
            icon="library"
            onClick={() => {
              selectType('exercise')
            }}
          />
          <SourceTypeButton
            active={entry.sourceType === 'machine'}
            label={t('source.machines')}
            icon="machine"
            onClick={() => {
              selectType('machine')
            }}
          />
        </div>
      </fieldset>
      {entry.sourceType === 'machine' ? (
        <label className="mt-4 block text-sm font-medium">
          {t('source.customMachine')}
          <select
            value={entry.customMachineId}
            onChange={(event) => {
              onChange({
                ...entry,
                exerciseId: '',
                customMachineId: event.target.value,
              })
            }}
            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
          >
            <option value="">{t('source.chooseMachine')}</option>
            {machines.map((machine) => (
              <option key={machine.id} value={machine.id}>
                {machine.name}
              </option>
            ))}
          </select>
          {machines.length === 0 ? (
            <span className="mt-2 block text-sm font-normal text-zinc-500">
              {t('source.noMachines')}
            </span>
          ) : null}
        </label>
      ) : (
        <ExerciseOptionPicker
          selectedId={entry.exerciseId}
          onSelect={(option) => {
            onChange({
              ...entry,
              exerciseId: option.id,
              customMachineId: '',
            })
          }}
        />
      )}
    </div>
  )
}

function SourceTypeButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  icon: 'library' | 'machine'
  onClick: () => void
}) {
  const Icon = icon === 'library' ? Library : Settings2
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 font-semibold ${active ? 'border-lime-300/60 bg-lime-300/10 text-lime-300' : 'border-white/10 text-zinc-300'}`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  )
}
