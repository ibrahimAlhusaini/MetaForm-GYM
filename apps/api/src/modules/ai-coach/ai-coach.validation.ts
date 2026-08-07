import { z } from 'zod'
import {
  AI_HISTORY_DEFAULT_LIMIT,
  AI_HISTORY_MAX_LIMIT,
} from './ai-coach.constants.js'

const language = z.enum(['en', 'ar']).default('en')
const sourceSelection = z
  .object({
    sourceType: z.enum(['EXERCISE', 'CUSTOM_MACHINE']),
    sourceId: z.uuid(),
  })
  .strict()
export const createAiCoachSessionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PROGRESS_ANALYSIS'), language }).strict(),
  z
    .object({
      type: z.literal('PLATEAU_DETECTION'),
      language,
      selection: sourceSelection,
    })
    .strict(),
  z
    .object({
      type: z.literal('WORKOUT_PLAN_REVIEW'),
      language,
      selection: z.object({ workoutPlanId: z.uuid() }).strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal('NEXT_WORKOUT_GUIDANCE'),
      language,
      selection: sourceSelection,
    })
    .strict(),
  z.object({ type: z.literal('NUTRITION_REVIEW'), language }).strict(),
  z.object({ type: z.literal('WEEKLY_SUMMARY'), language }).strict(),
])
const optionalDate = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value))
  .optional()
export const aiCoachHistorySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(AI_HISTORY_MAX_LIMIT)
      .default(AI_HISTORY_DEFAULT_LIMIT),
    type: z
      .enum([
        'PROGRESS_ANALYSIS',
        'PLATEAU_DETECTION',
        'WORKOUT_PLAN_REVIEW',
        'NEXT_WORKOUT_GUIDANCE',
        'NUTRITION_REVIEW',
        'WEEKLY_SUMMARY',
      ])
      .optional(),
    status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ABANDONED']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    dateFrom: optionalDate,
    dateTo: optionalDate,
  })
  .strict()
  .refine(
    (value) =>
      !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
    { message: 'dateFrom must not be after dateTo' },
  )
export const aiCoachSessionParamsSchema = z
  .object({ sessionId: z.uuid() })
  .strict()
export type CreateAiCoachSessionInput = z.infer<
  typeof createAiCoachSessionSchema
>
export type AiCoachHistoryInput = z.infer<typeof aiCoachHistorySchema>
export type AiCoachSessionParams = z.infer<typeof aiCoachSessionParamsSchema>
