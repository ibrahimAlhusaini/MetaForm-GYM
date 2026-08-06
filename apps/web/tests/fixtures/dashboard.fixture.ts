import type {
  DashboardSummaryData,
  DashboardSummaryResponse,
  StrengthProgressItem,
} from '@metaform/shared-types'

export const emptyDashboardData: DashboardSummaryData = {
  user: { firstName: 'Dashboard' },
  overview: {
    currentBodyWeightKg: null,
    dailyCalories: null,
    currentWorkoutStreak: 0,
    workoutsCompleted: 0,
    lastWorkout: null,
    weeklyProgress: {
      completedWorkouts: 0,
      previousWeekCompletedWorkouts: 0,
      percentageChange: 0,
    },
  },
  bodyWeightProgress: {
    points: [],
    trend: {
      direction: 'INSUFFICIENT_DATA',
      changeKg: null,
      percentageChange: null,
    },
  },
  strengthProgress: { machines: [] },
  meta: {
    generatedAt: '2026-08-05T12:00:00.000Z',
    bodyWeightDataAvailable: false,
    strengthDataAvailable: false,
  },
}

export const strengthItem: StrengthProgressItem = {
  sourceType: 'EXERCISE',
  sourceId: '8b2fd2a7-c66c-4bdf-90b0-f3e38026ea3d',
  name: 'Bench Press',
  imageUrl: 'https://example.com/bench-press.jpg',
  targetMuscle: 'CHEST',
  personalRecordKg: 60,
  latestWeightKg: 60,
  previousWeightKg: 55,
  changeKg: 5,
  percentageChange: 9.09,
  totalSessions: 4,
  points: [
    { date: '2026-08-01', weightKg: 55 },
    { date: '2026-08-05', weightKg: 60 },
  ],
}

export const populatedDashboardData: DashboardSummaryData = {
  user: { firstName: 'Amina' },
  overview: {
    currentBodyWeightKg: 78.5,
    dailyCalories: 2450,
    currentWorkoutStreak: 3,
    workoutsCompleted: 12,
    lastWorkout: {
      id: '1da91b1a-183d-46d4-8452-6c22786fb33e',
      startedAt: '2026-08-05T08:00:00.000Z',
      completedAt: '2026-08-05T09:04:00.000Z',
      durationMinutes: 64,
    },
    weeklyProgress: {
      completedWorkouts: 3,
      previousWeekCompletedWorkouts: 2,
      percentageChange: 50,
    },
  },
  bodyWeightProgress: {
    points: [
      { date: '2026-08-01', weightKg: 77 },
      { date: '2026-08-05', weightKg: 78.5 },
    ],
    trend: {
      direction: 'INCREASING',
      changeKg: 1.5,
      percentageChange: 1.95,
    },
  },
  strengthProgress: { machines: [strengthItem] },
  meta: {
    generatedAt: '2026-08-05T12:00:00.000Z',
    bodyWeightDataAvailable: true,
    strengthDataAvailable: true,
  },
}

export const dashboardResponse: DashboardSummaryResponse = {
  success: true,
  data: populatedDashboardData,
}
