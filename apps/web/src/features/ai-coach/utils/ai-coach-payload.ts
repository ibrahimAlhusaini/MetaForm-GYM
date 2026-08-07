import type {
  AiCoachCapabilityType,
  AiCoachLanguage,
  AiCoachSessionCreateRequest,
} from '@metaform/shared-types'
import type { AiCoachSelectionState } from '../types/ai-coach.types.js'
import { aiCoachRequestSchema } from '../validation/ai-coach.schema.js'

export const buildAiCoachRequest = (
  type: AiCoachCapabilityType,
  language: AiCoachLanguage,
  selection: AiCoachSelectionState,
): AiCoachSessionCreateRequest | null => {
  const candidate =
    type === 'PLATEAU_DETECTION' || type === 'NEXT_WORKOUT_GUIDANCE'
      ? {
          type,
          language,
          ...(selection?.kind === 'source'
            ? {
                selection: {
                  sourceType: selection.sourceType,
                  sourceId: selection.sourceId,
                },
              }
            : {}),
        }
      : type === 'WORKOUT_PLAN_REVIEW'
        ? {
            type,
            language,
            ...(selection?.kind === 'plan'
              ? { selection: { workoutPlanId: selection.workoutPlanId } }
              : {}),
          }
        : { type, language }
  const parsed = aiCoachRequestSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}
