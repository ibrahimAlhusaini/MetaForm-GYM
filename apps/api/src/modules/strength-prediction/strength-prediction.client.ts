import type { StrengthPredictionData } from '@metaform/shared-types'
import { env } from '../../config/env.js'
import { AppError } from '../../utils/app-error.js'
import { STRENGTH_PREDICTION_UNAVAILABLE } from './strength-prediction.constants.js'
import { internalStrengthPredictionSchema } from './strength-prediction.validation.js'

interface StrengthSessionPayload {
  completedAt: string
  maxWeightKg: number
}

const unavailable = (): AppError =>
  new AppError(503, 'Strength prediction is temporarily unavailable', {
    code: STRENGTH_PREDICTION_UNAVAILABLE,
  })

export const requestStrengthPrediction = async (
  sourceType: 'EXERCISE' | 'CUSTOM_MACHINE',
  sessions: StrengthSessionPayload[],
): Promise<StrengthPredictionData> => {
  try {
    const response = await fetch(
      new URL('/v1/strength/predict', env.BODY_WEIGHT_PREDICTION_SERVICE_URL),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sourceType, sessions }),
        signal: AbortSignal.timeout(env.BODY_WEIGHT_PREDICTION_TIMEOUT_MS),
      },
    )
    if (!response.ok) throw unavailable()
    const parsed = internalStrengthPredictionSchema.safeParse(
      await response.json(),
    )
    if (!parsed.success || parsed.data.sourceType !== sourceType)
      throw unavailable()
    return parsed.data
  } catch {
    throw unavailable()
  }
}
