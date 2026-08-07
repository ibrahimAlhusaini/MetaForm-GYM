import type {
  AiCoachCapabilityType,
  AiCoachSessionStatus,
  AiCoachSourceType,
} from '@metaform/shared-types'

export interface AiCoachHistoryQuery {
  page: number
  limit: number
  type?: AiCoachCapabilityType
  status?: AiCoachSessionStatus
  dateFrom?: string
  dateTo?: string
  sortOrder: 'asc' | 'desc'
}

export type AiCoachSelectionState =
  | {
      kind: 'source'
      sourceType: AiCoachSourceType
      sourceId: string
      label: string
    }
  | { kind: 'plan'; workoutPlanId: string; label: string }
  | null

export type AiCoachGenerationError = 'unavailable' | 'general' | null
