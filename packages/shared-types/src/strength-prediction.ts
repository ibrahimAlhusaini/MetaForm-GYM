export type StrengthPredictionStatus = 'AVAILABLE' | 'ABSTAINED'
export type StrengthPredictionSourceType = 'EXERCISE' | 'CUSTOM_MACHINE'
export type StrengthPredictionReasonCode =
  | 'INSUFFICIENT_SOURCE_HISTORY'
  | 'NO_COMPLETED_SOURCE_HISTORY'
  | 'EXCESSIVE_RECENT_GAP'
  | 'INVALID_STRENGTH_HISTORY'
  | 'INTERNAL_PREDICTION_UNAVAILABLE'

interface StrengthPredictionBase {
  previewStatus: 'RESEARCH_PREVIEW'
  method: 'LAST_SESSION'
  methodVersion: 'strength-next-session-v1'
  sourceType: StrengthPredictionSourceType
  history: {
    completedSourceSessions: number
    recentCadenceDays: number | null
  }
  disclaimerCode: 'EXPERIMENTAL_STRENGTH_ESTIMATE'
}

export type StrengthPredictionData = StrengthPredictionBase &
  (
    | {
        status: 'AVAILABLE'
        estimatedNextMaxWeightKg: number
        currentMaxWeightKg: number
        expectedChangeKg: number
        reliability: { reasonCodes: [] }
      }
    | {
        status: 'ABSTAINED'
        estimatedNextMaxWeightKg: null
        currentMaxWeightKg: number | null
        expectedChangeKg: null
        reliability: { reasonCodes: StrengthPredictionReasonCode[] }
      }
  )

export interface StrengthPredictionResponse {
  success: true
  data: StrengthPredictionData
}
