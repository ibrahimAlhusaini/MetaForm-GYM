import type { WorkoutPlanDetail } from '@metaform/shared-types'
import { useTranslation } from 'react-i18next'
import { difficultyLabel } from '../../../i18n/enum-labels.js'
import { planOwnershipLabel } from '../utils/workout-plan-formatters.js'

export function WorkoutPlanSummary({ plan }: { plan: WorkoutPlanDetail }) {
  const { t } = useTranslation(['workoutPlans', 'common'])
  const metrics = [
    [t('card.days', { count: plan.totalDays }), plan.totalDays],
    [t('card.training', { count: plan.trainingDays }), plan.trainingDays],
    [t('card.rest', { count: plan.restDays }), plan.restDays],
    [t('card.exercises', { count: plan.totalExercises }), plan.totalExercises],
  ]
  return (
    <section
      aria-label={t('detail.summary')}
      className="rounded-2xl border border-white/10 bg-[#111315] p-5"
    >
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={String(label)}>
            <dt className="text-sm text-zinc-500">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/8 pt-4 text-sm">
        <div>
          <dt className="text-zinc-500">{t('builder.difficulty')}</dt>
          <dd className="mt-1 font-semibold">
            {difficultyLabel(t, plan.difficultyLevel)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">{t('labels.ownership')}</dt>
          <dd className="mt-1 font-semibold">{planOwnershipLabel(t, plan)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">{t('labels.templateState')}</dt>
          <dd className="mt-1 font-semibold">
            {t(plan.isTemplate ? 'labels.yes' : 'labels.no')}
          </dd>
        </div>
      </dl>
    </section>
  )
}
