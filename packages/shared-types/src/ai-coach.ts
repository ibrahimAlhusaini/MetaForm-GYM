export type AiCoachCapabilityType =
  | 'PROGRESS_ANALYSIS'
  | 'PLATEAU_DETECTION'
  | 'WORKOUT_PLAN_REVIEW'
  | 'NEXT_WORKOUT_GUIDANCE'
  | 'NUTRITION_REVIEW'
  | 'WEEKLY_SUMMARY'
export type AiCoachLanguage = 'en' | 'ar'
export type AiCoachSourceType = 'EXERCISE' | 'CUSTOM_MACHINE'
export type AiCoachSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
export type AiCoachFindingSeverity = 'INFO' | 'CAUTION'

export interface AiCoachSourceSelection {
  sourceType: AiCoachSourceType
  sourceId: string
}
export type AiCoachSessionCreateRequest =
  | { type: 'PROGRESS_ANALYSIS'; language?: AiCoachLanguage }
  | {
      type: 'PLATEAU_DETECTION'
      language?: AiCoachLanguage
      selection: AiCoachSourceSelection
    }
  | {
      type: 'WORKOUT_PLAN_REVIEW'
      language?: AiCoachLanguage
      selection: { workoutPlanId: string }
    }
  | {
      type: 'NEXT_WORKOUT_GUIDANCE'
      language?: AiCoachLanguage
      selection: AiCoachSourceSelection
    }
  | { type: 'NUTRITION_REVIEW'; language?: AiCoachLanguage }
  | { type: 'WEEKLY_SUMMARY'; language?: AiCoachLanguage }

export interface AiCoachCapabilityDefinition {
  type: AiCoachCapabilityType
  requires: { exerciseSource: boolean; workoutPlan: boolean }
}
export interface AiCoachFinding {
  code: string
  text: string
  severity: AiCoachFindingSeverity
}
export interface AiCoachRecommendation {
  code: string
  title: string
  description: string
  priority: number
}
export interface AiCoachEvidence {
  metric: string
  value: string | number | boolean | null
  unit: string | null
}
export interface AiCoachResult {
  headline: string
  summary: string
  findings: AiCoachFinding[]
  recommendations: AiCoachRecommendation[]
  evidence: AiCoachEvidence[]
  cautions: string[]
}
export interface AiCoachMetadata {
  dataWindowDays: number | null
  analyticsVersion: string
  coachVersion: string
}
export interface AiCoachSelectionSummary {
  sourceType?: AiCoachSourceType
  sourceId?: string
  workoutPlanId?: string
}
export interface AiCoachSessionSummary {
  id: string
  type: AiCoachCapabilityType
  status: AiCoachSessionStatus
  headline: string | null
  language: AiCoachLanguage
  selection: AiCoachSelectionSummary | null
  startedAt: string
  completedAt: string | null
}
export interface AiCoachSessionDetail extends AiCoachSessionSummary {
  result: AiCoachResult | null
  metadata: AiCoachMetadata
}
export interface AiCoachPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
export interface AiCoachCapabilitiesResponse {
  success: true
  data: AiCoachCapabilityDefinition[]
}
export interface AiCoachSessionResponse {
  success: true
  data: AiCoachSessionDetail
}
export interface AiCoachSessionHistoryResponse {
  success: true
  data: { items: AiCoachSessionSummary[]; pagination: AiCoachPagination }
}
