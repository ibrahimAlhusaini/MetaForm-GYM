import type { CreateAiCoachSessionInput } from '../ai-coach.validation.js'
import {
  buildNutritionContext,
  buildProgressContext,
  buildWeeklyContext,
} from './general.context.js'
import { buildPlanContext } from './plan.context.js'
import { buildSourceContext } from './source.context.js'

export const buildAiCoachContext = async (
  userId: string,
  input: CreateAiCoachSessionInput,
  now = new Date(),
): Promise<unknown> => {
  switch (input.type) {
    case 'PROGRESS_ANALYSIS':
      return buildProgressContext(userId, now)
    case 'PLATEAU_DETECTION':
    case 'NEXT_WORKOUT_GUIDANCE':
      return buildSourceContext(userId, input)
    case 'WORKOUT_PLAN_REVIEW':
      return buildPlanContext(userId, input.selection.workoutPlanId)
    case 'NUTRITION_REVIEW':
      return buildNutritionContext(userId, now)
    case 'WEEKLY_SUMMARY':
      return buildWeeklyContext(userId, now)
  }
}
