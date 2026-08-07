import type { WorkoutPlanDayItem } from '@metaform/shared-types'
import { Copy, Pencil, Play, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { ClonePlanDialog } from '../components/ClonePlanDialog.js'
import { DeletePlanDialog } from '../components/DeletePlanDialog.js'
import { StartWorkoutDialog } from '../components/StartWorkoutDialog.js'
import { WorkoutPlanDayCard } from '../components/WorkoutPlanDayCard.js'
import { WorkoutPlanSummary } from '../components/WorkoutPlanSummary.js'
import {
  WorkoutPlanError,
  WorkoutPlanLoading,
} from '../components/WorkoutPlanStates.js'
import { useWorkoutPlanDetail } from '../hooks/useWorkoutPlanDetail.js'
import { useWorkoutPlanMutations } from '../hooks/useWorkoutPlanMutations.js'
import {
  cloneWorkoutPlan,
  deleteWorkoutPlan,
} from '../services/workout-plans.service.js'

export function WorkoutPlanDetailPage() {
  const { t } = useTranslation('workoutPlans')
  const { planId = '' } = useParams()
  const navigate = useNavigate()
  const planQuery = useWorkoutPlanDetail(planId)
  const mutations = useWorkoutPlanMutations()
  const [cloneOpen, setCloneOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [startDays, setStartDays] = useState<WorkoutPlanDayItem[] | null>(null)
  if (planQuery.state.status === 'loading') return <WorkoutPlanLoading detail />
  if (planQuery.state.status === 'error')
    return (
      <WorkoutPlanError
        message={planQuery.state.errorMessage}
        onRetry={planQuery.retry}
      />
    )
  const plan = planQuery.state.data
  const owned = plan.ownershipType === 'USER'
  const trainingDays = [...plan.days]
    .filter((day) => !day.isRestDay)
    .sort((a, b) => a.orderIndex - b.orderIndex)
  const startDay = (day: WorkoutPlanDayItem) => {
    void navigate(
      `/app/weights/sessions/new?workoutPlanId=${encodeURIComponent(plan.id)}&planDayId=${encodeURIComponent(day.id)}`,
    )
  }
  const begin = () => {
    if (trainingDays.length === 1 && trainingDays[0]) startDay(trainingDays[0])
    else if (trainingDays.length > 1) setStartDays(trainingDays)
  }
  return (
    <div>
      <Link to="/app/plans" className="text-sm text-lime-300">
        {t('detail.back')}
      </Link>
      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">{plan.name}</h1>
          {plan.description ? (
            <p className="mt-3 max-w-3xl leading-7 text-zinc-400">
              {plan.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={begin}
            disabled={trainingDays.length === 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime-300 px-4 font-semibold text-zinc-950 disabled:opacity-40"
          >
            <Play className="size-4" />
            {t('detail.start')}
          </button>
          {owned ? (
            <Link
              to={`/app/plans/${plan.id}/edit`}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4"
            >
              <Pencil className="size-4" />
              {t('card.edit')}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setCloneOpen(true)
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4"
          >
            <Copy className="size-4" />
            {t('card.clone')}
          </button>
          {owned ? (
            <button
              type="button"
              onClick={() => {
                setDeleteOpen(true)
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-400/20 px-4 text-red-300"
            >
              <Trash2 className="size-4" />
              {t('card.delete')}
            </button>
          ) : null}
        </div>
      </header>
      {!owned ? (
        <p className="mt-5 rounded-xl border border-lime-300/15 bg-lime-300/5 p-4 text-sm text-zinc-300">
          {t('detail.readOnly')}
        </p>
      ) : null}
      {trainingDays.length === 0 ? (
        <p className="mt-5 text-sm text-zinc-400">{t('start.noTraining')}</p>
      ) : null}
      <div className="mt-7">
        <WorkoutPlanSummary plan={plan} />
      </div>
      <section className="mt-8" aria-labelledby="weekly-schedule-title">
        <h2 id="weekly-schedule-title" className="text-2xl font-semibold">
          {t('detail.weeklySchedule')}
        </h2>
        <div className="mt-4 space-y-5">
          {plan.days.length ? (
            [...plan.days]
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((day) => <WorkoutPlanDayCard key={day.id} day={day} />)
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 p-5 text-zinc-500">
              {t('detail.noDays')}
            </p>
          )}
        </div>
      </section>
      {mutations.error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-400/20 p-4 text-red-200"
        >
          {mutations.error}
        </p>
      ) : null}
      {cloneOpen ? (
        <ClonePlanDialog
          plan={plan}
          pending={mutations.pending}
          onClose={() => {
            setCloneOpen(false)
          }}
          onConfirm={(name) => {
            void mutations
              .run(
                () =>
                  cloneWorkoutPlan(
                    plan.id,
                    name.trim() ? { name: name.trim() } : {},
                  ),
                t('errors.clone'),
              )
              .then((created) => {
                if (created) void navigate(`/app/plans/${created.id}`)
              })
          }}
        />
      ) : null}
      {deleteOpen ? (
        <DeletePlanDialog
          plan={plan}
          pending={mutations.pending}
          onClose={() => {
            setDeleteOpen(false)
          }}
          onConfirm={() => {
            void mutations
              .run(() => deleteWorkoutPlan(plan.id), t('errors.delete'))
              .then((result) => {
                if (result !== null) void navigate('/app/plans')
              })
          }}
        />
      ) : null}
      {startDays ? (
        <StartWorkoutDialog
          days={startDays}
          onClose={() => {
            setStartDays(null)
          }}
          onSelect={startDay}
        />
      ) : null}
    </div>
  )
}
