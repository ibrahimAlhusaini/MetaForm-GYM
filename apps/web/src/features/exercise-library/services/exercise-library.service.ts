import type {
  ExerciseDetail,
  ExerciseFilterOptions,
  ExerciseOption,
} from '@metaform/shared-types'
import { apiClient } from '../../../services/api-client.js'
import type {
  ApiResponse,
  ExerciseListData,
  ExerciseListQuery,
  ExerciseOptionQuery,
} from '../types/exercise-library.types.js'

const root = '/exercises'

export const fetchExercises = async (
  query: ExerciseListQuery,
): Promise<ExerciseListData> => {
  const response = await apiClient.get<ApiResponse<ExerciseListData>>(root, {
    params: query,
  })
  return response.data.data
}

export const fetchExerciseFilterOptions =
  async (): Promise<ExerciseFilterOptions> => {
    const response = await apiClient.get<ApiResponse<ExerciseFilterOptions>>(
      `${root}/filter-options`,
    )
    return response.data.data
  }

export const fetchExercise = async (id: string): Promise<ExerciseDetail> => {
  const response = await apiClient.get<
    ApiResponse<{ exercise: ExerciseDetail }>
  >(`${root}/${id}`)
  return response.data.data.exercise
}

export const fetchExerciseOptions = async (
  query: ExerciseOptionQuery,
): Promise<ExerciseOption[]> => {
  const response = await apiClient.get<
    ApiResponse<{ items: ExerciseOption[] }>
  >(`${root}/options`, { params: query })
  return response.data.data.items
}
