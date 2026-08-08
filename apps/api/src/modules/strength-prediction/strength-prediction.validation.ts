import { z } from 'zod'

const reason = z.enum([
  'INSUFFICIENT_SOURCE_HISTORY',
  'NO_COMPLETED_SOURCE_HISTORY',
  'EXCESSIVE_RECENT_GAP',
  'INVALID_STRENGTH_HISTORY',
  'INTERNAL_PREDICTION_UNAVAILABLE',
])

const base = z.object({
  previewStatus: z.literal('RESEARCH_PREVIEW'),
  method: z.literal('LAST_SESSION'),
  methodVersion: z.literal('strength-next-session-v1'),
  sourceType: z.enum(['EXERCISE', 'CUSTOM_MACHINE']),
  history: z.object({
    completedSourceSessions: z.number().int().nonnegative(),
    recentCadenceDays: z.number().nonnegative().nullable(),
  }),
  disclaimerCode: z.literal('EXPERIMENTAL_STRENGTH_ESTIMATE'),
})

export const internalStrengthPredictionSchema = z.discriminatedUnion('status', [
  base.extend({
    status: z.literal('AVAILABLE'),
    estimatedNextMaxWeightKg: z.number().nonnegative(),
    currentMaxWeightKg: z.number().positive(),
    expectedChangeKg: z.number(),
    reliability: z.object({ reasonCodes: z.tuple([]) }),
  }),
  base.extend({
    status: z.literal('ABSTAINED'),
    estimatedNextMaxWeightKg: z.null(),
    currentMaxWeightKg: z.number().positive().nullable(),
    expectedChangeKg: z.null(),
    reliability: z.object({ reasonCodes: z.array(reason).min(1) }),
  }),
])
