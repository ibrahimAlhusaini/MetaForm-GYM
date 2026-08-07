import type { AiCoachCapabilityDefinition } from '@metaform/shared-types'

export const COACH_VERSION = '1.0'
export const AI_ANALYTICS_VERSION = '1.0'
export const AI_CONTEXT_SCHEMA_VERSION = '1.0'
export const AI_DATA_WINDOW_DAYS = 90
export const AI_SOURCE_HISTORY_LIMIT = 12
export const AI_HISTORY_DEFAULT_LIMIT = 20
export const AI_HISTORY_MAX_LIMIT = 50
export const AI_PROVIDER_TIMEOUT_MS = 20_000
export const AI_GENERATION_RATE_LIMIT = 10
export const AI_GENERATION_RATE_WINDOW_MS = 15 * 60 * 1000

export const AI_COACH_CAPABILITIES: readonly AiCoachCapabilityDefinition[] = [
  {
    type: 'PROGRESS_ANALYSIS',
    requires: { exerciseSource: false, workoutPlan: false },
  },
  {
    type: 'PLATEAU_DETECTION',
    requires: { exerciseSource: true, workoutPlan: false },
  },
  {
    type: 'WORKOUT_PLAN_REVIEW',
    requires: { exerciseSource: false, workoutPlan: true },
  },
  {
    type: 'NEXT_WORKOUT_GUIDANCE',
    requires: { exerciseSource: true, workoutPlan: false },
  },
  {
    type: 'NUTRITION_REVIEW',
    requires: { exerciseSource: false, workoutPlan: false },
  },
  {
    type: 'WEEKLY_SUMMARY',
    requires: { exerciseSource: false, workoutPlan: false },
  },
]
