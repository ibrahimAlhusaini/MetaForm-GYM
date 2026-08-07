import type { WorkoutPlanDayItem } from '@metaform/shared-types'
import { useTranslation } from 'react-i18next'
import { dayOfWeekLabel } from '../../../i18n/enum-labels.js'
import { useModalDialog } from '../hooks/useModalDialog.js'

export function StartWorkoutDialog({
  days,
  onClose,
  onSelect,
}: {
  days: WorkoutPlanDayItem[]
  onClose: () => void
  onSelect: (day: WorkoutPlanDayItem) => void
}) {
  const { t } = useTranslation(['workoutPlans', 'common'])
  const dialogRef = useModalDialog(true)
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="start-workout-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-white/10 bg-[#151719] p-0 text-zinc-100 backdrop:bg-black/75"
    >
      <div className="p-6">
        <h2 id="start-workout-title" className="text-xl font-semibold">
          {t('workoutPlans:start.title')}
        </h2>
        <p className="mt-2 text-zinc-400">
          {t('workoutPlans:start.description')}
        </p>
        <div className="mt-5 space-y-3">
          {days.map((day, index) => (
            <button
              key={day.id}
              type="button"
              autoFocus={index === 0}
              onClick={() => {
                onSelect(day)
              }}
              className="flex min-h-14 w-full items-center justify-between rounded-xl border border-white/10 px-4 text-start hover:border-lime-300/40"
            >
              <span>
                <strong className="block">
                  {day.name ?? dayOfWeekLabel(t, day.dayOfWeek)}
                </strong>
                <span className="text-sm text-zinc-400">
                  {dayOfWeekLabel(t, day.dayOfWeek)}
                </span>
              </span>
              <span className="text-sm text-zinc-400">
                {t('workoutPlans:start.count', { count: day.exercises.length })}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 min-h-11 rounded-xl border border-white/10 px-4"
        >
          {t('common:actions.cancel')}
        </button>
      </div>
    </dialog>
  )
}
