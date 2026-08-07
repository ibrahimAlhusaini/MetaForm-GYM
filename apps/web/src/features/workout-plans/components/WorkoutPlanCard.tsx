import type { WorkoutPlanSummary } from '@metaform/shared-types'
import { CalendarDays, Copy, Dumbbell, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { difficultyLabel } from '../../../i18n/enum-labels.js'
import {
  formatPlanDate,
  planOwnershipLabel,
} from '../utils/workout-plan-formatters.js'

export function WorkoutPlanCard({
  plan,
  owned,
  onClone,
  onDelete,
}: {
  plan: WorkoutPlanSummary
  owned: boolean
  onClone: (plan: WorkoutPlanSummary) => void
  onDelete: (plan: WorkoutPlanSummary) => void
}) {
  const { t } = useTranslation(['workoutPlans', 'common'])
  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#111315] p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-lime-300/10 px-3 py-1 text-xs font-semibold text-lime-300">
          {planOwnershipLabel(t, plan)}
        </span>
        <span className="text-xs text-zinc-500">
          {difficultyLabel(t, plan.difficultyLevel)}
        </span>
      </div>
      <h2 className="mt-4 text-xl font-semibold">{plan.name}</h2>
      <p className="mt-2 line-clamp-3 min-h-12 text-sm leading-6 text-zinc-400">
        {plan.description ?? t('common:states.unavailable')}
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm text-zinc-300">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-lime-300" />
          <span>{t('workoutPlans:card.days', { count: plan.totalDays })}</span>
        </div>
        <div className="flex items-center gap-2">
          <Dumbbell className="size-4 text-lime-300" />
          <span>
            {t('workoutPlans:card.exercises', { count: plan.totalExercises })}
          </span>
        </div>
        <div>
          {t('workoutPlans:card.training', { count: plan.trainingDays })}
        </div>
        <div>{t('workoutPlans:card.rest', { count: plan.restDays })}</div>
      </dl>
      {owned ? (
        <p className="mt-4 text-xs text-zinc-500">
          {t('workoutPlans:card.updated', {
            date: formatPlanDate(plan.updatedAt),
          })}
        </p>
      ) : null}
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Link
          to={`/app/plans/${plan.id}`}
          className="min-h-10 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-zinc-950"
        >
          {t('workoutPlans:card.view')}
        </Link>
        {owned ? (
          <Link
            to={`/app/plans/${plan.id}/edit`}
            aria-label={`${t('workoutPlans:card.edit')} ${plan.name}`}
            className="rounded-lg border border-white/10 p-2"
          >
            <Pencil className="size-4" />
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => {
            onClone(plan)
          }}
          aria-label={`${t('workoutPlans:card.clone')} ${plan.name}`}
          className="rounded-lg border border-white/10 p-2"
        >
          <Copy className="size-4" />
        </button>
        {owned ? (
          <button
            type="button"
            onClick={() => {
              onDelete(plan)
            }}
            aria-label={`${t('workoutPlans:card.delete')} ${plan.name}`}
            className="rounded-lg border border-red-400/20 p-2 text-red-300"
          >
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </div>
    </article>
  )
}
