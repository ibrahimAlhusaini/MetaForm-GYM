import type { WorkoutPlanDayItem } from '@metaform/shared-types'
import { Bed, Dumbbell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { dayOfWeekLabel } from '../../../i18n/enum-labels.js'
import { PlannedExerciseRow } from './PlannedExerciseRow.js'

export function WorkoutPlanDayCard({ day }: { day: WorkoutPlanDayItem }) {
  const { t } = useTranslation('workoutPlans')
  const Icon = day.isRestDay ? Bed : Dumbbell
  return (
    <article className="rounded-2xl border border-white/10 bg-[#111315] p-5">
      <header className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-lime-300/8 text-lime-300">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-xs font-semibold text-lime-300 uppercase">
            {dayOfWeekLabel(t, day.dayOfWeek)}
          </p>
          <h3 className="mt-1 text-xl font-semibold">
            {day.name ??
              t(day.isRestDay ? 'labels.restDay' : 'labels.trainingDay')}
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            {t(day.isRestDay ? 'labels.restDay' : 'labels.trainingDay')}
          </p>
        </div>
      </header>
      {day.notes ? (
        <p className="mt-4 leading-7 text-zinc-400">{day.notes}</p>
      ) : null}
      {!day.isRestDay ? (
        day.exercises.length ? (
          <ol className="mt-5 space-y-3">
            {[...day.exercises]
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((item) => (
                <PlannedExerciseRow key={item.id} item={item} />
              ))}
          </ol>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
            {t('detail.noExercises')}
          </p>
        )
      ) : null}
    </article>
  )
}
