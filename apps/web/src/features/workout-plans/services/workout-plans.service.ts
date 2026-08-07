import type {
  CloneWorkoutPlanRequest,
  CreatePlannedExerciseRequest,
  CreateWorkoutPlanDayRequest,
  CreateWorkoutPlanRequest,
  ReorderPlannedExercisesRequest,
  ReorderWorkoutPlanDaysRequest,
  UpdatePlannedExerciseRequest,
  UpdateWorkoutPlanDayRequest,
  UpdateWorkoutPlanRequest,
  WorkoutPlanDetail,
  WorkoutPlanDetailResponse,
  WorkoutPlanListResponse,
  WorkoutPlanMutationResponse,
} from '@metaform/shared-types'
import { apiClient } from '../../../services/api-client.js'
import type {
  WorkoutPlanListData,
  WorkoutPlanQuery,
} from '../types/workout-plans.types.js'

const root = '/workout-plans'

export const fetchWorkoutPlans = async (
  query: WorkoutPlanQuery,
): Promise<WorkoutPlanListData> => {
  const response = await apiClient.get<WorkoutPlanListResponse>(root, {
    params: query,
  })
  return response.data.data
}

export const fetchWorkoutPlanTemplates = async (
  query: Omit<WorkoutPlanQuery, 'ownership' | 'isTemplate'>,
): Promise<WorkoutPlanListData> => {
  const response = await apiClient.get<WorkoutPlanListResponse>(
    `${root}/templates`,
    { params: query },
  )
  return response.data.data
}

export const fetchWorkoutPlan = async (
  planId: string,
): Promise<WorkoutPlanDetail> => {
  const response = await apiClient.get<WorkoutPlanDetailResponse>(
    `${root}/${planId}`,
  )
  return response.data.data
}

const detail = (response: { data: WorkoutPlanMutationResponse }) =>
  response.data.data

export const createWorkoutPlan = async (input: CreateWorkoutPlanRequest) =>
  detail(await apiClient.post<WorkoutPlanMutationResponse>(root, input))
export const updateWorkoutPlan = async (
  planId: string,
  input: UpdateWorkoutPlanRequest,
) =>
  detail(
    await apiClient.patch<WorkoutPlanMutationResponse>(
      `${root}/${planId}`,
      input,
    ),
  )
export const cloneWorkoutPlan = async (
  planId: string,
  input: CloneWorkoutPlanRequest,
) =>
  detail(
    await apiClient.post<WorkoutPlanMutationResponse>(
      `${root}/${planId}/clone`,
      input,
    ),
  )
export const deleteWorkoutPlan = async (planId: string): Promise<void> => {
  await apiClient.delete(`${root}/${planId}`)
}

export const createWorkoutPlanDay = async (
  planId: string,
  input: CreateWorkoutPlanDayRequest,
) =>
  detail(
    await apiClient.post<WorkoutPlanMutationResponse>(
      `${root}/${planId}/days`,
      input,
    ),
  )
export const updateWorkoutPlanDay = async (
  dayId: string,
  input: UpdateWorkoutPlanDayRequest,
) =>
  detail(
    await apiClient.patch<WorkoutPlanMutationResponse>(
      `${root}/days/${dayId}`,
      input,
    ),
  )
export const deleteWorkoutPlanDay = async (dayId: string) =>
  detail(
    await apiClient.delete<WorkoutPlanMutationResponse>(
      `${root}/days/${dayId}`,
    ),
  )
export const reorderWorkoutPlanDays = async (
  planId: string,
  input: ReorderWorkoutPlanDaysRequest,
) =>
  detail(
    await apiClient.post<WorkoutPlanMutationResponse>(
      `${root}/${planId}/days/reorder`,
      input,
    ),
  )

export const createPlannedExercise = async (
  dayId: string,
  input: CreatePlannedExerciseRequest,
) =>
  detail(
    await apiClient.post<WorkoutPlanMutationResponse>(
      `${root}/days/${dayId}/exercises`,
      input,
    ),
  )
export const updatePlannedExercise = async (
  planExerciseId: string,
  input: UpdatePlannedExerciseRequest,
) =>
  detail(
    await apiClient.patch<WorkoutPlanMutationResponse>(
      `${root}/exercises/${planExerciseId}`,
      input,
    ),
  )
export const deletePlannedExercise = async (planExerciseId: string) =>
  detail(
    await apiClient.delete<WorkoutPlanMutationResponse>(
      `${root}/exercises/${planExerciseId}`,
    ),
  )
export const reorderPlannedExercises = async (
  dayId: string,
  input: ReorderPlannedExercisesRequest,
) =>
  detail(
    await apiClient.post<WorkoutPlanMutationResponse>(
      `${root}/days/${dayId}/exercises/reorder`,
      input,
    ),
  )
