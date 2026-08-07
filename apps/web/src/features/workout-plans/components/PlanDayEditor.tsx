import type { WorkoutPlanDayOfWeek } from '@metaform/shared-types'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { dayOfWeekLabel } from '../../../i18n/enum-labels.js'
import type {
  PlanDayDraft,
  PlannedExerciseDraft,
} from '../types/workout-plans.types.js'
import { moveItem } from '../utils/workout-plan-order.js'
import { PlanReorderControls } from './PlanReorderControls.js'
import { PlannedExerciseEditor } from './PlannedExerciseEditor.js'

const weekdays: WorkoutPlanDayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]
const emptyExercise = (): PlannedExerciseDraft => ({
  exercise: null,
  sets: '',
  reps: '',
  restSeconds: '',
  notes: '',
})

export function PlanDayEditor({
  day,
  index,
  total,
  usedDays,
  onChange,
  onMove,
  onRemove,
  onSaveDay,
  onSaveExercise,
  onRemoveExercise,
  onExerciseMove,
  pending = false,
}: {
  day: PlanDayDraft
  index: number
  total: number
  usedDays: WorkoutPlanDayOfWeek[]
  onChange: (day: PlanDayDraft) => void
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
  onSaveDay?: () => void
  onSaveExercise?: (exerciseIndex: number) => void
  onRemoveExercise?: (exerciseIndex: number) => void
  onExerciseMove?: (exerciseIndex: number, direction: -1 | 1) => void
  pending?: boolean
}) {
  const { t } = useTranslation(['workoutPlans', 'common'])
  const [confirmRest, setConfirmRest] = useState(false)
  const toggleRest = (checked: boolean) => {
    if (checked && day.exercises.length) setConfirmRest(true)
    else onChange({ ...day, isRestDay: checked })
  }
  return (
    <fieldset className="rounded-2xl border border-white/10 bg-[#111315] p-4 sm:p-5">
      <legend className="px-2 text-lg font-semibold">
        {t('workoutPlans:builder.dayLegend', { number: index + 1 })}
      </legend>
      <div className="flex flex-wrap justify-between gap-3">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">
            {t('workoutPlans:builder.selectDay')}
            <select
              value={day.dayOfWeek}
              onChange={(event) => {
                const selected = weekdays.find(
                  (value) => value === event.target.value,
                )
                if (selected) onChange({ ...day, dayOfWeek: selected })
              }}
              className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
            >
              {weekdays.map((weekday) => (
                <option
                  key={weekday}
                  value={weekday}
                  disabled={
                    weekday !== day.dayOfWeek && usedDays.includes(weekday)
                  }
                >
                  {dayOfWeekLabel(t, weekday)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t('workoutPlans:builder.dayName')}{' '}
            <span className="text-zinc-500">
              {t('workoutPlans:labels.optional')}
            </span>
            <input
              value={day.name}
              onChange={(event) => {
                onChange({ ...day, name: event.target.value })
              }}
              maxLength={120}
              className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <PlanReorderControls
            index={index}
            total={total}
            upLabel={t('workoutPlans:reorder.dayUp', { number: index + 1 })}
            downLabel={t('workoutPlans:reorder.dayDown', { number: index + 1 })}
            onMove={onMove}
          />
          <button
            type="button"
            onClick={onRemove}
            aria-label={t('workoutPlans:builder.removeDay')}
            className="rounded-lg border border-red-400/20 p-2 text-red-300"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <label className="mt-4 block text-sm">
        {t('workoutPlans:builder.notes')}{' '}
        <span className="text-zinc-500">
          {t('workoutPlans:labels.optional')}
        </span>
        <textarea
          value={day.notes}
          onChange={(event) => {
            onChange({ ...day, notes: event.target.value })
          }}
          rows={2}
          maxLength={2000}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3"
        />
      </label>
      <label className="mt-4 inline-flex items-center gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={day.isRestDay}
          onChange={(event) => {
            toggleRest(event.target.checked)
          }}
          className="size-4 accent-lime-300"
        />
        {t('workoutPlans:builder.restDay')}
      </label>
      {onSaveDay ? (
        <button
          type="button"
          disabled={pending}
          onClick={onSaveDay}
          className="ms-4 min-h-10 rounded-lg bg-white px-4 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          {t(
            pending
              ? 'workoutPlans:builder.saving'
              : 'workoutPlans:builder.saveDay',
          )}
        </button>
      ) : null}
      {!day.isRestDay ? (
        <div className="mt-5 space-y-4">
          {day.exercises.map((exercise, exerciseIndex) => (
            <PlannedExerciseEditor
              key={exercise.id ?? String(exerciseIndex)}
              item={exercise}
              index={exerciseIndex}
              total={day.exercises.length}
              onChange={(value) => {
                onChange({
                  ...day,
                  exercises: day.exercises.map((candidate, candidateIndex) =>
                    candidateIndex === exerciseIndex ? value : candidate,
                  ),
                })
              }}
              onMove={(direction) => {
                if (onExerciseMove) onExerciseMove(exerciseIndex, direction)
                else
                  onChange({
                    ...day,
                    exercises: moveItem(
                      day.exercises,
                      exerciseIndex,
                      exerciseIndex + direction,
                    ),
                  })
              }}
              onRemove={() => {
                if (onRemoveExercise) onRemoveExercise(exerciseIndex)
                else
                  onChange({
                    ...day,
                    exercises: day.exercises.filter(
                      (_, candidateIndex) => candidateIndex !== exerciseIndex,
                    ),
                  })
              }}
              {...(onSaveExercise
                ? {
                    onSave: () => {
                      onSaveExercise(exerciseIndex)
                    },
                  }
                : {})}
              pending={pending}
            />
          ))}
          <button
            type="button"
            onClick={() => {
              onChange({
                ...day,
                exercises: [...day.exercises, emptyExercise()],
              })
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-lime-300/20 px-3 text-sm font-semibold text-lime-300"
          >
            <Plus className="size-4" />
            {t('workoutPlans:builder.addExercise')}
          </button>
        </div>
      ) : null}
      {confirmRest ? (
        <dialog
          open
          aria-labelledby={`rest-confirm-${String(index)}`}
          className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/10 bg-[#151719] p-6 text-zinc-100 backdrop:bg-black/75"
        >
          <h2
            id={`rest-confirm-${String(index)}`}
            className="text-xl font-semibold"
          >
            {t('workoutPlans:restConfirm.title')}
          </h2>
          <p className="mt-3 text-zinc-400">
            {t('workoutPlans:restConfirm.description')}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setConfirmRest(false)
              }}
              className="min-h-11 rounded-xl border border-white/10 px-4"
            >
              {t('common:actions.cancel')}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({ ...day, isRestDay: true, exercises: [] })
                setConfirmRest(false)
              }}
              className="min-h-11 rounded-xl bg-red-200 px-4 font-semibold text-zinc-950"
            >
              {t('workoutPlans:restConfirm.confirm')}
            </button>
          </div>
        </dialog>
      ) : null}
    </fieldset>
  )
}
