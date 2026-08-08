import type { BodyWeightPredictionData } from '@metaform/shared-types'
import { env } from '../../config/env.js'
import { AppError } from '../../utils/app-error.js'
import { BODY_WEIGHT_PREDICTION_UNAVAILABLE } from './body-weight-prediction.constants.js'
import { internalPredictionResponseSchema } from './body-weight-prediction.validation.js'

interface InternalMeasurement {
  measuredAt: string
  weightKg: number
}

const unavailable = (): AppError =>
  new AppError(503, 'Body weight prediction is temporarily unavailable', {
    code: BODY_WEIGHT_PREDICTION_UNAVAILABLE,
  })

export const requestBodyWeightPrediction = async (
  measurements: InternalMeasurement[],
): Promise<BodyWeightPredictionData> => {
  try {
    const response = await fetch(
      new URL(
        '/v1/body-weight/predict',
        env.BODY_WEIGHT_PREDICTION_SERVICE_URL,
      ),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ measurements }),
        signal: AbortSignal.timeout(env.BODY_WEIGHT_PREDICTION_TIMEOUT_MS),
      },
    )
    if (!response.ok) throw unavailable()
    const parsed = internalPredictionResponseSchema.safeParse(
      await response.json(),
    )
    if (!parsed.success) throw unavailable()
    return parsed.data
  } catch {
    throw unavailable()
  }
}
