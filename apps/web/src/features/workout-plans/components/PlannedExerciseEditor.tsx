import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PlannedExerciseDraft } from '../types/workout-plans.types.js'
import { PlanReorderControls } from './PlanReorderControls.js'
import { PlannedExercisePicker } from './PlannedExercisePicker.js'

export function PlannedExerciseEditor({
  item,
  index,
  total,
  onChange,
  onMove,
  onRemove,
  onSave,
  pending = false,
  reorderDisabled = false,
}: {
  item: PlannedExerciseDraft
  index: number
  total: number
  onChange: (item: PlannedExerciseDraft) => void
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
  onSave?: () => void
  pending?: boolean
  reorderDisabled?: boolean
}) {
  const { t } = useTranslation('workoutPlans')
  return (
    <fieldset className="rounded-xl border border-white/10 bg-black/15 p-4">
      <legend className="px-2 text-sm font-semibold">
        {t('builder.exerciseLegend', { number: index + 1 })}
      </legend>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {item.exercise ? (
            <button
              type="button"
              onClick={() => {
                onChange({ ...item, exercise: null })
              }}
              className="min-h-11 w-full rounded-xl border border-lime-300/30 px-3 text-start"
            >
              <strong>{item.exercise.name}</strong>
              <span className="ms-2 text-sm text-zinc-500">
                {t('builder.chooseExercise')}
              </span>
            </button>
          ) : (
            <PlannedExercisePicker
              onSelect={(option) => {
                onChange({ ...item, exercise: option })
              }}
            />
          )}
        </div>
        <div className="flex gap-2">
          <PlanReorderControls
            index={index}
            total={total}
            upLabel={t('reorder.exerciseUp', { number: index + 1 })}
            downLabel={t('reorder.exerciseDown', { number: index + 1 })}
            onMove={onMove}
            disabled={reorderDisabled}
          />
          <button
            type="button"
            onClick={onRemove}
            aria-label={t('builder.removeExercise', { number: index + 1 })}
            className="rounded-lg border border-red-400/20 p-2 text-red-300"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          {t('builder.sets')}
          <input
            inputMode="numeric"
            dir="ltr"
            value={item.sets}
            onChange={(event) => {
              onChange({ ...item, sets: event.target.value })
            }}
            className="mt-1 min-h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3"
          />
        </label>
        <label className="text-sm">
          {t('builder.reps')}
          <input
            dir="ltr"
            value={item.reps}
            onChange={(event) => {
              onChange({ ...item, reps: event.target.value })
            }}
            maxLength={80}
            className="mt-1 min-h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3"
          />
        </label>
        <label className="text-sm">
          {t('builder.restSeconds')}
          <input
            inputMode="numeric"
            dir="ltr"
            value={item.restSeconds}
            onChange={(event) => {
              onChange({ ...item, restSeconds: event.target.value })
            }}
            className="mt-1 min-h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3"
          />
        </label>
      </div>
      <label className="mt-3 block text-sm">
        {t('builder.notes')}
        <input
          value={item.notes}
          onChange={(event) => {
            onChange({ ...item, notes: event.target.value })
          }}
          maxLength={2000}
          className="mt-1 min-h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3"
        />
      </label>
      {onSave ? (
        <button
          type="button"
          disabled={pending}
          onClick={onSave}
          className="mt-3 min-h-10 rounded-lg bg-white px-4 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          {t(pending ? 'builder.saving' : 'builder.saveExercise')}
        </button>
      ) : null}
    </fieldset>
  )
}
