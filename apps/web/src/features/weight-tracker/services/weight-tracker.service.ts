import { apiClient } from '../../../services/api-client.js'
import type {
  ApiResponse,
  BulkSessionInput,
  ExerciseLog,
  ExerciseSet,
  LogInput,
  Machine,
  MachineInput,
  MachineQuery,
  PaginatedMachines,
  PaginatedSessions,
  SessionDetail,
  SessionMetadataInput,
  SessionQuery,
  SetInput,
  SourceHistory,
  SourceType,
} from '../types/weight-tracker.types.js'

const root = '/weight-tracker'

export const fetchMachines = async (
  query: MachineQuery = {},
): Promise<PaginatedMachines> => {
  const response = await apiClient.get<ApiResponse<PaginatedMachines>>(
    `${root}/machines`,
    { params: query },
  )
  return response.data.data
}
export const fetchMachine = async (id: string): Promise<Machine> => {
  const response = await apiClient.get<ApiResponse<{ machine: Machine }>>(
    `${root}/machines/${id}`,
  )
  return response.data.data.machine
}
export const createMachine = async (input: MachineInput): Promise<Machine> => {
  const response = await apiClient.post<ApiResponse<{ machine: Machine }>>(
    `${root}/machines`,
    input,
  )
  return response.data.data.machine
}
export const updateMachine = async (
  id: string,
  input: Partial<MachineInput>,
): Promise<Machine> => {
  const response = await apiClient.patch<ApiResponse<{ machine: Machine }>>(
    `${root}/machines/${id}`,
    input,
  )
  return response.data.data.machine
}
export const deleteMachine = async (id: string): Promise<void> => {
  await apiClient.delete(`${root}/machines/${id}`)
}

export const fetchSessions = async (
  query: SessionQuery = {},
): Promise<PaginatedSessions> => {
  const response = await apiClient.get<ApiResponse<PaginatedSessions>>(
    `${root}/sessions`,
    { params: query },
  )
  return response.data.data
}
export const fetchSession = async (id: string): Promise<SessionDetail> => {
  const response = await apiClient.get<ApiResponse<{ session: SessionDetail }>>(
    `${root}/sessions/${id}`,
  )
  return response.data.data.session
}
export const createBulkSession = async (
  input: BulkSessionInput,
): Promise<SessionDetail> => {
  const response = await apiClient.post<
    ApiResponse<{ session: SessionDetail }>
  >(`${root}/sessions/with-entries`, input)
  return response.data.data.session
}
export const updateSession = async (
  id: string,
  input: SessionMetadataInput,
): Promise<SessionDetail> => {
  const response = await apiClient.patch<
    ApiResponse<{ session: SessionDetail }>
  >(`${root}/sessions/${id}`, input)
  return response.data.data.session
}
export const completeSession = async (id: string): Promise<SessionDetail> => {
  const response = await apiClient.post<
    ApiResponse<{ session: SessionDetail }>
  >(`${root}/sessions/${id}/complete`, {})
  return response.data.data.session
}
export const deleteSession = async (id: string): Promise<void> => {
  await apiClient.delete(`${root}/sessions/${id}`)
}

export const createLog = async (
  sessionId: string,
  input: LogInput,
): Promise<ExerciseLog> => {
  const response = await apiClient.post<ApiResponse<{ log: ExerciseLog }>>(
    `${root}/sessions/${sessionId}/logs`,
    input,
  )
  return response.data.data.log
}
export const updateLog = async (
  id: string,
  input: { notes?: string | null; orderIndex?: number },
): Promise<ExerciseLog> => {
  const response = await apiClient.patch<ApiResponse<{ log: ExerciseLog }>>(
    `${root}/logs/${id}`,
    input,
  )
  return response.data.data.log
}
export const deleteLog = async (id: string): Promise<void> => {
  await apiClient.delete(`${root}/logs/${id}`)
}
export const reorderLogs = async (
  sessionId: string,
  items: { logId: string; orderIndex: number }[],
): Promise<void> => {
  await apiClient.post(`${root}/sessions/${sessionId}/logs/reorder`, { items })
}

export const createSet = async (
  logId: string,
  input: SetInput,
): Promise<ExerciseSet> => {
  const response = await apiClient.post<ApiResponse<{ set: ExerciseSet }>>(
    `${root}/logs/${logId}/sets`,
    input,
  )
  return response.data.data.set
}
export const updateSet = async (
  id: string,
  input: Partial<SetInput>,
): Promise<ExerciseSet> => {
  const response = await apiClient.patch<ApiResponse<{ set: ExerciseSet }>>(
    `${root}/sets/${id}`,
    input,
  )
  return response.data.data.set
}
export const deleteSet = async (id: string): Promise<void> => {
  await apiClient.delete(`${root}/sets/${id}`)
}
export const reorderSets = async (
  logId: string,
  items: { setId: string; setNumber: number }[],
): Promise<void> => {
  await apiClient.post(`${root}/logs/${logId}/sets/reorder`, { items })
}

export const fetchSourceHistory = async (
  sourceType: SourceType,
  sourceId: string,
  page = 1,
): Promise<SourceHistory> => {
  const response = await apiClient.get<ApiResponse<{ history: SourceHistory }>>(
    `${root}/sources/${sourceType}/${sourceId}/history`,
    { params: { page } },
  )
  return response.data.data.history
}
