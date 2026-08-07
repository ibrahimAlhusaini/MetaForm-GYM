import type { WorkoutPlanExerciseItem } from '@metaform/shared-types'
import { ImageOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  equipmentLabel,
  muscleLabel,
  subgroupLabel,
} from '../../../i18n/enum-labels.js'

export function PlannedExerciseRow({
  item,
}: {
  item: WorkoutPlanExerciseItem
}) {
  const { t } = useTranslation(['workoutPlans', 'common'])
  return (
    <li className="grid gap-4 rounded-xl border border-white/8 bg-black/15 p-3 sm:grid-cols-[4rem_1fr_auto] sm:items-center">
      {item.exercise.thumbnailUrl ? (
        <img
          src={item.exercise.thumbnailUrl}
          alt={item.exercise.name}
          className="size-16 rounded-lg object-cover"
        />
      ) : (
        <span
          className="grid size-16 place-items-center rounded-lg bg-white/5"
          aria-label={t('common:states.unavailable')}
        >
          <ImageOff className="size-5 text-zinc-500" />
        </span>
      )}
      <div>
        <h4 className="font-semibold">{item.exercise.name}</h4>
        <p className="mt-1 text-sm text-zinc-400">
          {muscleLabel(t, item.exercise.primaryMuscle)}
          {item.exercise.muscleSubgroup
            ? ` · ${subgroupLabel(t, item.exercise.muscleSubgroup)}`
            : ''}{' '}
          · {equipmentLabel(t, item.exercise.equipmentType)}
        </p>
        {item.notes ? (
          <p className="mt-2 text-sm text-zinc-400">{item.notes}</p>
        ) : null}
      </div>
      <div className="text-sm text-zinc-300">
        {item.sets ? (
          <p>{t('workoutPlans:detail.sets', { count: item.sets })}</p>
        ) : null}
        {item.reps ? (
          <p>{t('workoutPlans:detail.reps', { value: item.reps })}</p>
        ) : null}
        {item.restSeconds !== null ? (
          <p>{t('workoutPlans:detail.rest', { value: item.restSeconds })}</p>
        ) : null}
      </div>
    </li>
  )
}
