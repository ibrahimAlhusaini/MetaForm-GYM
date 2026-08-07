import { z } from 'zod'

const language = z.enum(['en', 'ar'])
const source = z
  .object({
    sourceType: z.enum(['EXERCISE', 'CUSTOM_MACHINE']),
    sourceId: z.string().min(1),
  })
  .strict()

export const aiCoachRequestSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PROGRESS_ANALYSIS'), language }).strict(),
  z
    .object({
      type: z.literal('PLATEAU_DETECTION'),
      language,
      selection: source,
    })
    .strict(),
  z
    .object({
      type: z.literal('WORKOUT_PLAN_REVIEW'),
      language,
      selection: z.object({ workoutPlanId: z.string().min(1) }).strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal('NEXT_WORKOUT_GUIDANCE'),
      language,
      selection: source,
    })
    .strict(),
  z.object({ type: z.literal('NUTRITION_REVIEW'), language }).strict(),
  z.object({ type: z.literal('WEEKLY_SUMMARY'), language }).strict(),
])
