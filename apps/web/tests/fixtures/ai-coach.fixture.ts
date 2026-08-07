import type {
  AiCoachCapabilityDefinition,
  AiCoachSessionDetail,
  AiCoachSessionSummary,
} from '@metaform/shared-types'

export const aiCoachCapabilities: AiCoachCapabilityDefinition[] = [
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

export const aiCoachSession: AiCoachSessionDetail = {
  id: '99999999-9999-4999-8999-999999999999',
  type: 'PROGRESS_ANALYSIS',
  status: 'COMPLETED',
  headline: 'Steady strength progress',
  language: 'en',
  selection: null,
  startedAt: '2026-08-07T10:00:00.000Z',
  completedAt: '2026-08-07T10:00:05.000Z',
  result: {
    headline: 'Steady strength progress',
    summary: 'Your recent completed workouts show a consistent direction.',
    findings: [
      {
        code: 'CONSISTENT_TRAINING',
        text: 'Training frequency has remained consistent.',
        severity: 'INFO',
      },
    ],
    recommendations: [
      {
        code: 'RECOVERY',
        title: 'Protect recovery',
        description: 'Keep recovery days between demanding sessions.',
        priority: 2,
      },
      {
        code: 'CONTINUE',
        title: 'Continue consistently',
        description: 'Keep logging completed working sets.',
        priority: 1,
      },
    ],
    evidence: [
      { metric: 'completed_workouts', value: 4, unit: null },
      { metric: 'future_metric_key', value: 1.25, unit: 'score' },
    ],
    cautions: ['This is general fitness guidance.'],
  },
  metadata: {
    dataWindowDays: 90,
    analyticsVersion: '1.0',
    coachVersion: '1.0',
  },
}

const completedResult = aiCoachSession.result
if (!completedResult) throw new Error('Completed fixture result is required')

export const insufficientAiCoachSession: AiCoachSessionDetail = {
  ...aiCoachSession,
  id: '88888888-8888-4888-8888-888888888888',
  type: 'NUTRITION_REVIEW',
  headline: 'More nutrition data needed',
  result: {
    ...completedResult,
    headline: 'More nutrition data needed',
    findings: [
      {
        code: 'INSUFFICIENT_DATA',
        text: 'No saved nutrition calculation is available.',
        severity: 'INFO',
      },
    ],
    evidence: [],
  },
}

export const abandonedSession: AiCoachSessionSummary = {
  id: '77777777-7777-4777-8777-777777777777',
  type: 'WEEKLY_SUMMARY',
  status: 'ABANDONED',
  headline: null,
  language: 'ar',
  selection: null,
  startedAt: '2026-08-06T10:00:00.000Z',
  completedAt: '2026-08-06T10:00:02.000Z',
}

export const aiCoachHistory = {
  items: [aiCoachSession, abandonedSession],
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 12,
    totalPages: 2,
    hasNextPage: true,
    hasPreviousPage: false,
  },
}
