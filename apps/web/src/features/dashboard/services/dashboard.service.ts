import type {
  DashboardSummaryData,
  DashboardSummaryResponse,
} from '@metaform/shared-types'
import { apiClient } from '../../../services/api-client.js'

let inFlightRequest: Promise<DashboardSummaryData> | null = null

const requestDashboardSummary = async (): Promise<DashboardSummaryData> => {
  const response =
    await apiClient.get<DashboardSummaryResponse>('/dashboard/summary')
  return response.data.data
}

export const fetchDashboardSummary = (): Promise<DashboardSummaryData> => {
  inFlightRequest ??= requestDashboardSummary().finally(() => {
    inFlightRequest = null
  })

  return inFlightRequest
}

export const resetDashboardRequestForTests = (): void => {
  inFlightRequest = null
}
