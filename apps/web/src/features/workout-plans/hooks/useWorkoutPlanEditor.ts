import type { WorkoutPlanDetail } from '@metaform/shared-types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { PlanDayDraft } from '../types/workout-plans.types.js'
import { detailToDraftDays } from '../utils/workout-plan-payload.js'
import {
  createPlanDraftSchema,
  createPlanMetadataSchema,
  type PlanMetadataFormValues,
} from '../validation/workout-plan.schemas.js'
import { useWorkoutPlanEditorActions } from './useWorkoutPlanEditorActions.js'
import { useWorkoutPlanMutations } from './useWorkoutPlanMutations.js'

export const useWorkoutPlanEditor = (initialPlan: WorkoutPlanDetail) => {
  const { t } = useTranslation('workoutPlans')
  const [plan, setPlan] = useState(initialPlan)
  const [days, setDays] = useState(() => detailToDraftDays(initialPlan))
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const mutations = useWorkoutPlanMutations()
  const metadataSchema = useMemo(() => createPlanMetadataSchema(t), [t])
  const daySchema = useMemo(() => createPlanDraftSchema(t), [t])
  const form = useForm<PlanMetadataFormValues>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      name: plan.name,
      description: plan.description ?? '',
      difficultyLevel: plan.difficultyLevel,
      isTemplate: plan.isTemplate,
    },
  })
  const validateDay = (day: PlanDayDraft): boolean => {
    const result = daySchema.safeParse([day])
    if (result.success) {
      setValidationErrors([])
      return true
    }
    setValidationErrors(result.error.issues.map((issue) => issue.message))
    return false
  }
  const actions = useWorkoutPlanEditorActions({
    plan,
    days,
    setPlan,
    setDays,
    validateDay,
    mutations,
    t,
  })
  return {
    plan,
    days,
    setDays,
    form,
    mutations,
    validationErrors,
    ...actions,
  }
}
