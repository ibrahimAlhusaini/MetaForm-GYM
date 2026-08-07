import type { WorkoutPlanDetail } from '@metaform/shared-types'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router'
import { PlanDayEditor } from '../components/PlanDayEditor.js'
import { PlanMetadataForm } from '../components/PlanMetadataForm.js'
import {
  WorkoutPlanError,
  WorkoutPlanLoading,
} from '../components/WorkoutPlanStates.js'
import { useWorkoutPlanDetail } from '../hooks/useWorkoutPlanDetail.js'
import { useWorkoutPlanEditor } from '../hooks/useWorkoutPlanEditor.js'

export function WorkoutPlanEditPage() {
  const { planId = '' } = useParams()
  const query = useWorkoutPlanDetail(planId)
  if (query.state.status === 'loading') return <WorkoutPlanLoading detail />
  if (query.state.status === 'error')
    return (
      <WorkoutPlanError
        message={query.state.errorMessage}
        onRetry={query.retry}
      />
    )
  if (query.state.data.ownershipType !== 'USER')
    return <Navigate to={`/app/plans/${query.state.data.id}`} replace />
  return <WorkoutPlanEditor plan={query.state.data} />
}

function WorkoutPlanEditor({ plan: initialPlan }: { plan: WorkoutPlanDetail }) {
  const { t } = useTranslation('workoutPlans')
  const editor = useWorkoutPlanEditor(initialPlan)
  return (
    <div className="space-y-6">
      <header>
        <Link
          to={`/app/plans/${editor.plan.id}`}
          className="text-sm text-lime-300"
        >
          {t('detail.back')}
        </Link>
        <h1 className="mt-3 text-3xl font-semibold">
          {t('builder.editTitle')}
        </h1>
        <p className="mt-2 text-zinc-400">{t('builder.editDescription')}</p>
      </header>
      <PlanMetadataForm
        form={editor.form}
        submitLabel={t('builder.updateMetadata')}
        pending={editor.mutations.pending}
        onSubmit={editor.saveMetadata}
      />
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t('builder.days')}</h2>
          <button
            type="button"
            onClick={editor.addDay}
            disabled={editor.days.length >= 7}
            className="min-h-11 rounded-xl border border-lime-300/20 px-4 font-semibold text-lime-300 disabled:opacity-40"
          >
            {t('builder.addDay')}
          </button>
        </div>
        <div className="mt-4 space-y-5">
          {editor.days.map((day, index) => (
            <PlanDayEditor
              key={day.id ?? `${day.dayOfWeek}-${String(index)}`}
              day={day}
              index={index}
              total={editor.days.length}
              usedDays={editor.days.map((item) => item.dayOfWeek)}
              pending={editor.mutations.pending}
              onChange={(value) => {
                editor.setDays(
                  editor.days.map((item, itemIndex) =>
                    itemIndex === index ? value : item,
                  ),
                )
              }}
              onMove={(direction) => {
                editor.moveDay(index, direction)
              }}
              onRemove={() => {
                editor.removeDay(index)
              }}
              onSaveDay={() => {
                editor.saveDay(index)
              }}
              onSaveExercise={(exerciseIndex) => {
                editor.saveExercise(index, exerciseIndex)
              }}
              onRemoveExercise={(exerciseIndex) => {
                editor.removeExercise(index, exerciseIndex)
              }}
              onExerciseMove={(exerciseIndex, direction) => {
                editor.moveExercise(index, exerciseIndex, direction)
              }}
            />
          ))}
        </div>
      </section>
      {editor.validationErrors.length ? (
        <div
          role="alert"
          className="rounded-xl border border-red-400/20 p-4 text-red-200"
        >
          <ul className="list-disc ps-5">
            {[...new Set(editor.validationErrors)].map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {editor.mutations.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/20 p-4 text-red-200"
        >
          {editor.mutations.error}
        </p>
      ) : null}
    </div>
  )
}
