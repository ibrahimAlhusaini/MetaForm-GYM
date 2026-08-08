import type { BodyWeightPredictionData } from '@metaform/shared-types'
import { prisma } from '../../config/prisma.js'
import { PREDICTION_HISTORY_LIMIT } from './body-weight-prediction.constants.js'
import { requestBodyWeightPrediction } from './body-weight-prediction.client.js'

export const getBodyWeightPrediction = async (
  userId: string,
): Promise<BodyWeightPredictionData> => {
  const rows = await prisma.bodyMeasurement.findMany({
    where: { userId },
    orderBy: [{ measuredAt: 'desc' }, { id: 'desc' }],
    take: PREDICTION_HISTORY_LIMIT,
    select: { measuredAt: true, weightKg: true },
  })
  return requestBodyWeightPrediction(
    rows.reverse().map((row) => ({
      measuredAt: row.measuredAt.toISOString(),
      weightKg: row.weightKg.toNumber(),
    })),
  )
}
