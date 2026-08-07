import type { AiCoachCapabilityType } from '@metaform/shared-types'
import {
  Activity,
  Apple,
  CalendarCheck,
  ChartNoAxesCombined,
  Dumbbell,
  Gauge,
  type LucideIcon,
} from 'lucide-react'

export interface CapabilityPresentation {
  icon: LucideIcon
  translationKey: string
}

export const capabilityPresentation: Record<
  AiCoachCapabilityType,
  CapabilityPresentation
> = {
  PROGRESS_ANALYSIS: {
    icon: ChartNoAxesCombined,
    translationKey: 'progressAnalysis',
  },
  PLATEAU_DETECTION: { icon: Gauge, translationKey: 'plateauDetection' },
  WORKOUT_PLAN_REVIEW: {
    icon: CalendarCheck,
    translationKey: 'workoutPlanReview',
  },
  NEXT_WORKOUT_GUIDANCE: {
    icon: Dumbbell,
    translationKey: 'nextWorkoutGuidance',
  },
  NUTRITION_REVIEW: { icon: Apple, translationKey: 'nutritionReview' },
  WEEKLY_SUMMARY: { icon: Activity, translationKey: 'weeklySummary' },
}

export const supportedCapabilityTypes = Object.keys(
  capabilityPresentation,
) as AiCoachCapabilityType[]
export const AI_COACH_HISTORY_LIMIT = 10
export const AI_COACH_PICKER_LIMIT = 10
