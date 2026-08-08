import type {
  BodyMeasurementHistoryResponse,
  BodyMeasurementItem,
  BodyMeasurementMutationResponse,
  BodyWeightPredictionData,
  BodyWeightPredictionResponse,
  CreateBodyMeasurementRequest,
} from '@metaform/shared-types'
import { apiClient } from '../../../services/api-client.js'

export const fetchBodyMeasurements = async (
  page = 1,
  limit = 30,
): Promise<BodyMeasurementHistoryResponse['data']> => {
  const response = await apiClient.get<BodyMeasurementHistoryResponse>(
    '/body-measurements',
    { params: { page, limit } },
  )
  return response.data.data
}

export const createBodyMeasurement = async (
  input: CreateBodyMeasurementRequest,
): Promise<BodyMeasurementItem> => {
  const response = await apiClient.post<BodyMeasurementMutationResponse>(
    '/body-measurements',
    input,
  )
  return response.data.data
}

export const fetchBodyWeightPrediction =
  async (): Promise<BodyWeightPredictionData> => {
    const response = await apiClient.get<BodyWeightPredictionResponse>(
      '/body-weight/prediction',
    )
    return response.data.data
  }
