import type {
  NutritionCalculationData,
  NutritionCalculationRequest,
  NutritionCalculationResponse,
  NutritionHistoryResponse,
  NutritionHistoryItem,
  NutritionLatestResponse,
  NutritionProfileInputs,
  NutritionProfileInputsResponse,
} from '@metaform/shared-types'
import { apiClient } from '../../../services/api-client.js'
import type { NutritionHistoryQuery } from '../types/nutrition.types.js'

const root = '/nutrition'

export const fetchNutritionProfileInputs =
  async (): Promise<NutritionProfileInputs> => {
    const response = await apiClient.get<NutritionProfileInputsResponse>(
      `${root}/profile-inputs`,
    )
    return response.data.data
  }

export const calculateNutrition = async (
  input: NutritionCalculationRequest,
): Promise<NutritionCalculationData> => {
  const response = await apiClient.post<NutritionCalculationResponse>(
    `${root}/calculate`,
    input,
  )
  return response.data.data
}

export const fetchLatestNutrition =
  async (): Promise<NutritionHistoryItem | null> => {
    const response = await apiClient.get<NutritionLatestResponse>(
      `${root}/latest`,
    )
    return response.data.data
  }

export const fetchNutritionHistory = async (
  query: NutritionHistoryQuery,
): Promise<NutritionHistoryResponse['data']> => {
  const response = await apiClient.get<NutritionHistoryResponse>(
    `${root}/history`,
    { params: query },
  )
  return response.data.data
}
