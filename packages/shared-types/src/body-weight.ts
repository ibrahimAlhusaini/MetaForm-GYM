export type BodyWeightPredictionStatus = 'AVAILABLE' | 'ABSTAINED'
export type BodyWeightPreviewStatus = 'RESEARCH_PREVIEW'
export type BodyWeightPredictionMethod = 'RECENT_TREND'
export type BodyWeightPredictionReasonCode =
  | 'INSUFFICIENT_PRIOR_HISTORY'
  | 'EXCESSIVE_RECENT_GAP'
  | 'INVALID_MEASUREMENT_HISTORY'
  | 'NO_RECENT_MEASUREMENT'
  | 'INTERNAL_PREDICTION_UNAVAILABLE'

export interface BodyWeightPredictionData {
  status: BodyWeightPredictionStatus
  previewStatus: BodyWeightPreviewStatus
  method: BodyWeightPredictionMethod
  methodVersion: string
  forecastHorizonDays: 7
  predictionDate: string
  targetDate: string
  predictedWeightKg: number | null
  currentWeightKg: number | null
  expectedChangeKg: number | null
  interval: {
    available: false
    lowerKg: number | null
    upperKg: number | null
    coverageTarget: number
    method: 'EMPIRICAL'
  }
  reliability: {
    priorMeasurementCount: number
    recentCadenceDays: number | null
    reasonCodes: BodyWeightPredictionReasonCode[]
  }
  disclaimerCode: 'EXPERIMENTAL_TREND_FORECAST'
}

export interface BodyWeightPredictionResponse {
  success: true
  data: BodyWeightPredictionData
}

export interface BodyMeasurementItem {
  id: string
  measuredAt: string
  weightKg: number
  createdAt: string
}

export interface CreateBodyMeasurementRequest {
  measuredAt: string
  weightKg: number
}

export interface BodyMeasurementMutationResponse {
  success: true
  message: string
  data: BodyMeasurementItem
}

export interface BodyMeasurementHistoryResponse {
  success: true
  data: {
    items: BodyMeasurementItem[]
    pagination: {
      page: number
      limit: number
      totalItems: number
      totalPages: number
    }
  }
}
