import type { WorkoutPlanDayOfWeek } from '@metaform/shared-types'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PlanDayDraft } from '../types/workout-plans.types.js'
import { moveItem } from '../utils/workout-plan-order.js'
import { PlanDayEditor } from './PlanDayEditor.js'

const weekdays: WorkoutPlanDayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

export function PlanBuilder({
  days,
  errors,
  onChange,
}: {
  days: PlanDayDraft[]
  errors: string[]
  onChange: (days: PlanDayDraft[]) => void
}) {
  const { t } = useTranslation('workoutPlans')
  const addDay = () => {
    const used = days.map((day) => day.dayOfWeek)
    const nextDay = weekdays.find((day) => !used.includes(day))
    if (!nextDay) return
    onChange([
      ...days,
      {
        dayOfWeek: nextDay,
        name: '',
        notes: '',
        isRestDay: false,
        exercises: [],
      },
    ])
  }
  return (
    <section aria-labelledby="plan-days-title">
      <div className="flex items-center justify-between gap-4">
        <h2 id="plan-days-title" className="text-2xl font-semibold">
          {t('builder.days')}
        </h2>
        <button
          type="button"
          disabled={days.length >= weekdays.length}
          onClick={addDay}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-lime-300/20 px-4 font-semibold text-lime-300 disabled:opacity-40"
        >
          <Plus className="size-4" />
          {t('builder.addDay')}
        </button>
      </div>
      <div className="mt-4 space-y-5">
        {days.map((day, index) => (
          <PlanDayEditor
            key={day.id ?? `${day.dayOfWeek}-${String(index)}`}
            day={day}
            index={index}
            total={days.length}
            usedDays={days.map((item) => item.dayOfWeek)}
            onChange={(value) => {
              onChange(
                days.map((candidate, candidateIndex) =>
                  candidateIndex === index ? value : candidate,
                ),
              )
            }}
            onMove={(direction) => {
              onChange(moveItem(days, index, index + direction))
            }}
            onRemove={() => {
              onChange(
                days.filter((_, candidateIndex) => candidateIndex !== index),
              )
            }}
          />
        ))}
      </div>
      {days.length >= weekdays.length ? (
        <p className="mt-3 text-sm text-zinc-500">
          {t('builder.noAvailableDays')}
        </p>
      ) : null}
      {errors.length ? (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200"
        >
          <p className="font-semibold">{t('validation.review')}</p>
          <ul className="mt-2 list-disc ps-5">
            {[...new Set(errors)].map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
