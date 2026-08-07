import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import {
  WeightTrackerErrorState,
  WeightTrackerSkeleton,
} from '../components/AsyncStates.js'
import { SessionBuilderForm } from '../components/SessionBuilderForm.js'
import { useMachines } from '../hooks/useMachines.js'
import { useWorkoutPlanPrefill } from '../hooks/useWorkoutPlanPrefill.js'

export function SessionBuilderPage() {
  const { t } = useTranslation('weightTracker')
  const [searchParams] = useSearchParams()
  const planPrefill = useWorkoutPlanPrefill(
    searchParams.get('workoutPlanId'),
    searchParams.get('planDayId'),
  )
  const machineQuery = useMemo(
    () => ({
      page: 1,
      limit: 100,
      sortBy: 'name' as const,
      sortOrder: 'asc' as const,
    }),
    [],
  )
  const machines = useMachines(machineQuery)
  if (
    machines.state.status === 'loading' ||
    planPrefill.state.status === 'loading'
  )
    return <WeightTrackerSkeleton label={t('loading.builder')} />
  if (machines.state.status === 'error')
    return (
      <WeightTrackerErrorState
        message={machines.state.errorMessage}
        onRetry={machines.retry}
      />
    )
  if (planPrefill.state.status === 'error')
    return (
      <WeightTrackerErrorState
        message={planPrefill.state.errorMessage}
        onRetry={planPrefill.retry}
      />
    )
  return (
    <SessionBuilderForm
      machines={machines.state.data.items}
      prefill={planPrefill.state.data}
    />
  )
}
