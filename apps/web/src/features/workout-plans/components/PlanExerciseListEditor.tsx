import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MAX_PLAN_EXERCISES_PER_DAY } from '../constants/workout-plan.constants.js'
import type {
  PlanDayDraft,
  PlannedExerciseDraft,
} from '../types/workout-plans.types.js'
import { moveItem } from '../utils/workout-plan-order.js'
import { PlannedExerciseEditor } from './PlannedExerciseEditor.js'

const emptyExercise = (): PlannedExerciseDraft => ({
  exercise: null,
  sets: '',
  reps: '',
  restSeconds: '',
  notes: '',
})

interface PlanExerciseListEditorProps {
  day: PlanDayDraft
  onChange: (day: PlanDayDraft) => void
  onSave?: (exerciseIndex: number) => void
  onRemove?: (exerciseIndex: number) => void
  onMove?: (exerciseIndex: number, direction: -1 | 1) => void
  pending: boolean
}

export function PlanExerciseListEditor({
  day,
  onChange,
  onSave,
  onRemove,
  onMove,
  pending,
}: PlanExerciseListEditorProps) {
  const { t } = useTranslation('workoutPlans')
  const reorderDisabled =
    onSave !== undefined && day.exercises.some((item) => !item.id)
  const atLimit = day.exercises.length >= MAX_PLAN_EXERCISES_PER_DAY

  return (
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
            if (onMove) onMove(exerciseIndex, direction)
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
            if (onRemove) onRemove(exerciseIndex)
            else
              onChange({
                ...day,
                exercises: day.exercises.filter(
                  (_, candidateIndex) => candidateIndex !== exerciseIndex,
                ),
              })
          }}
          {...(onSave
            ? {
                onSave: () => {
                  onSave(exerciseIndex)
                },
              }
            : {})}
          pending={pending}
          reorderDisabled={reorderDisabled}
        />
      ))}
      <button
        type="button"
        disabled={pending || atLimit}
        onClick={() => {
          onChange({
            ...day,
            exercises: [...day.exercises, emptyExercise()],
          })
        }}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-lime-300/20 px-3 text-sm font-semibold text-lime-300 disabled:opacity-40"
      >
        <Plus className="size-4" />
        {t('builder.addExercise')}
      </button>
      {atLimit ? (
        <p className="text-sm text-zinc-500">
          {t('builder.exerciseLimit', {
            count: MAX_PLAN_EXERCISES_PER_DAY,
          })}
        </p>
      ) : null}
    </div>
  )
}
