import type {
  AiCoachSelectionSummary,
  AiCoachSessionDetail,
  AiCoachSessionSummary,
} from '@metaform/shared-types'
import { z } from 'zod'
import { aiCoachResultSchema } from './provider/ai-coach-output.schema.js'

export const storedAnswersSchema = z
  .object({
    schemaVersion: z.string(),
    type: z.enum([
      'PROGRESS_ANALYSIS',
      'PLATEAU_DETECTION',
      'WORKOUT_PLAN_REVIEW',
      'NEXT_WORKOUT_GUIDANCE',
      'NUTRITION_REVIEW',
      'WEEKLY_SUMMARY',
    ]),
    language: z.enum(['en', 'ar']),
    selection: z
      .object({
        sourceType: z.enum(['EXERCISE', 'CUSTOM_MACHINE']).optional(),
        sourceId: z.string().optional(),
        workoutPlanId: z.string().optional(),
      })
      .nullable(),
    context: z.json(),
  })
  .loose()
export const storedRecommendationsSchema = z
  .object({
    result: aiCoachResultSchema,
    metadata: z.object({
      dataWindowDays: z.number().int().nullable(),
      analyticsVersion: z.string(),
      coachVersion: z.string(),
    }),
  })
  .strict()

interface SessionRow {
  id: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
  answers: unknown
  recommendations: unknown
  startedAt: Date
  completedAt: Date | null
}
const parseAnswers = (row: SessionRow) => {
  const parsed = storedAnswersSchema.safeParse(row.answers)
  if (!parsed.success) throw new Error('Invalid stored AI coach session')
  return parsed.data
}
const mapSelection = (
  selection: z.infer<typeof storedAnswersSchema>['selection'],
): AiCoachSelectionSummary | null => {
  if (!selection) return null
  return {
    ...(selection.sourceType ? { sourceType: selection.sourceType } : {}),
    ...(selection.sourceId ? { sourceId: selection.sourceId } : {}),
    ...(selection.workoutPlanId
      ? { workoutPlanId: selection.workoutPlanId }
      : {}),
  }
}
export const mapAiCoachSessionSummary = (
  row: SessionRow,
): AiCoachSessionSummary => {
  const answers = parseAnswers(row)
  const recommendations = storedRecommendationsSchema.safeParse(
    row.recommendations,
  )
  return {
    id: row.id,
    type: answers.type,
    status: row.status,
    headline: recommendations.success
      ? recommendations.data.result.headline
      : null,
    language: answers.language,
    selection: mapSelection(answers.selection),
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  }
}
export const mapAiCoachSessionDetail = (
  row: SessionRow,
): AiCoachSessionDetail => {
  const summary = mapAiCoachSessionSummary(row)
  const recommendations = storedRecommendationsSchema.safeParse(
    row.recommendations,
  )
  return {
    ...summary,
    result: recommendations.success ? recommendations.data.result : null,
    metadata: recommendations.success
      ? recommendations.data.metadata
      : { dataWindowDays: null, analyticsVersion: '1.0', coachVersion: '1.0' },
  }
}
