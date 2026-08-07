import type {
  AiCoachCapabilitiesResponse,
  AiCoachCapabilityDefinition,
  AiCoachSessionCreateRequest,
  AiCoachSessionDetail,
  AiCoachSessionHistoryResponse,
  AiCoachSessionResponse,
} from '@metaform/shared-types'
import { apiClient } from '../../../services/api-client.js'
import type { AiCoachHistoryQuery } from '../types/ai-coach.types.js'

const root = '/ai-coach'

export const fetchAiCoachCapabilities = async (): Promise<
  AiCoachCapabilityDefinition[]
> => {
  const response = await apiClient.get<AiCoachCapabilitiesResponse>(
    `${root}/capabilities`,
  )
  return response.data.data
}

export const createAiCoachSession = async (
  request: AiCoachSessionCreateRequest,
): Promise<AiCoachSessionDetail> => {
  const response = await apiClient.post<AiCoachSessionResponse>(
    `${root}/sessions`,
    request,
  )
  return response.data.data
}

export const fetchAiCoachSessions = async (query: AiCoachHistoryQuery) => {
  const response = await apiClient.get<AiCoachSessionHistoryResponse>(
    `${root}/sessions`,
    { params: query },
  )
  return response.data.data
}

export const fetchAiCoachSession = async (
  sessionId: string,
): Promise<AiCoachSessionDetail> => {
  const response = await apiClient.get<AiCoachSessionResponse>(
    `${root}/sessions/${sessionId}`,
  )
  return response.data.data
}
