import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { PlanBuilder } from '../components/PlanBuilder.js'
import { PlanMetadataForm } from '../components/PlanMetadataForm.js'
import { useWorkoutPlanMutations } from '../hooks/useWorkoutPlanMutations.js'
import { createWorkoutPlan } from '../services/workout-plans.service.js'
import type { PlanDayDraft } from '../types/workout-plans.types.js'
import { createPlanPayload } from '../utils/workout-plan-payload.js'
import {
  createPlanDraftSchema,
  createPlanMetadataSchema,
  type PlanMetadataFormValues,
} from '../validation/workout-plan.schemas.js'

export function WorkoutPlanCreatePage() {
  const { t } = useTranslation('workoutPlans')
  const navigate = useNavigate()
  const mutations = useWorkoutPlanMutations()
  const [days, setDays] = useState<PlanDayDraft[]>([])
  const [dayErrors, setDayErrors] = useState<string[]>([])
  const metadataSchema = useMemo(() => createPlanMetadataSchema(t), [t])
  const daySchema = useMemo(() => createPlanDraftSchema(t), [t])
  const form = useForm<PlanMetadataFormValues>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      name: '',
      description: '',
      difficultyLevel: 'BEGINNER',
      isTemplate: false,
    },
  })
  const submit = (metadata: PlanMetadataFormValues) => {
    const parsedDays = daySchema.safeParse(days)
    if (!parsedDays.success) {
      setDayErrors(parsedDays.error.issues.map((issue) => issue.message))
      return
    }
    setDayErrors([])
    void mutations
      .run(
        () => createWorkoutPlan(createPlanPayload(metadata, days)),
        t('errors.create'),
      )
      .then((plan) => {
        if (plan) void navigate(`/app/plans/${plan.id}`)
      })
  }
  return (
    <div className="space-y-6">
      <header>
        <Link to="/app/plans" className="text-sm text-lime-300">
          {t('detail.back')}
        </Link>
        <h1 className="mt-3 text-3xl font-semibold">
          {t('builder.createTitle')}
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          {t('builder.createDescription')}
        </p>
      </header>
      <PlanMetadataForm
        form={form}
        submitLabel={t('builder.save')}
        pending={mutations.pending}
        onSubmit={submit}
      />
      <PlanBuilder days={days} errors={dayErrors} onChange={setDays} />
      {mutations.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/20 p-4 text-red-200"
        >
          {mutations.error}
        </p>
      ) : null}
    </div>
  )
}
