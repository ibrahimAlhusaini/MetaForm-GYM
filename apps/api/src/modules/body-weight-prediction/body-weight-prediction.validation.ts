import { z } from 'zod'

const reasonCode = z.enum([
  'INSUFFICIENT_PRIOR_HISTORY',
  'EXCESSIVE_RECENT_GAP',
  'INVALID_MEASUREMENT_HISTORY',
  'NO_RECENT_MEASUREMENT',
  'INTERNAL_PREDICTION_UNAVAILABLE',
])

export const internalPredictionResponseSchema = z
  .object({
    status: z.enum(['AVAILABLE', 'ABSTAINED']),
    previewStatus: z.literal('RESEARCH_PREVIEW'),
    method: z.literal('RECENT_TREND'),
    methodVersion: z.string().min(1).max(100),
    forecastHorizonDays: z.literal(7),
    predictionDate: z.iso.datetime({ offset: true }),
    targetDate: z.iso.datetime({ offset: true }),
    predictedWeightKg: z.number().nullable(),
    currentWeightKg: z.number().nullable(),
    expectedChangeKg: z.number().nullable(),
    interval: z
      .object({
        available: z.literal(false),
        lowerKg: z.null(),
        upperKg: z.null(),
        coverageTarget: z.number().gt(0).lt(1),
        method: z.literal('EMPIRICAL'),
      })
      .strict(),
    reliability: z
      .object({
        priorMeasurementCount: z.number().int().nonnegative(),
        recentCadenceDays: z.number().nonnegative().nullable(),
        reasonCodes: z.array(reasonCode).max(5),
      })
      .strict(),
    disclaimerCode: z.literal('EXPERIMENTAL_TREND_FORECAST'),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.status === 'AVAILABLE' &&
      (value.predictedWeightKg === null ||
        value.currentWeightKg === null ||
        value.expectedChangeKg === null ||
        value.reliability.reasonCodes.length > 0)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Invalid available prediction',
      })
    }
    if (
      value.status === 'ABSTAINED' &&
      (value.predictedWeightKg !== null || value.expectedChangeKg !== null)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Invalid abstained prediction',
      })
    }
  })

export const emptyPredictionQuerySchema = z.object({}).strict()
