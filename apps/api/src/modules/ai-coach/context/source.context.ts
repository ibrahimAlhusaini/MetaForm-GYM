import { getSourceHistory } from '../../weight-tracker/history.service.js'
import { AI_SOURCE_HISTORY_LIMIT } from '../ai-coach.constants.js'
import {
  analyzePlateau,
  classifyNextWorkout,
} from '../analytics/source-guidance.analytics.js'
import type { CreateAiCoachSessionInput } from '../ai-coach.validation.js'

type SourceInput = Extract<
  CreateAiCoachSessionInput,
  { type: 'PLATEAU_DETECTION' | 'NEXT_WORKOUT_GUIDANCE' }
>
export const buildSourceContext = async (
  userId: string,
  input: SourceInput,
) => {
  const history = await getSourceHistory(
    userId,
    {
      sourceType:
        input.selection.sourceType === 'EXERCISE' ? 'exercise' : 'machine',
      sourceId: input.selection.sourceId,
    },
    { page: 1, limit: AI_SOURCE_HISTORY_LIMIT, sortOrder: 'desc' },
  )
  const weights = history.chartPoints
    .map((point) => point.representativeWeightKg)
    .filter((value): value is number => value !== null)
  const common = {
    source: {
      type: history.source.type,
      name: history.source.name,
      targetMuscle: history.source.targetMuscle,
    },
    recentRepresentativeWeightsKg: weights,
    totalQualifyingSessions: history.totalSessions,
    insufficientData: weights.length < 2,
  }
  return input.type === 'PLATEAU_DETECTION'
    ? { ...common, analysis: analyzePlateau(weights) }
    : {
        ...common,
        analysis: {
          classification: classifyNextWorkout(weights),
          latestRepresentativeWeightKg: weights.at(-1) ?? null,
          previousRepresentativeWeightKg: weights.at(-2) ?? null,
        },
      }
}
