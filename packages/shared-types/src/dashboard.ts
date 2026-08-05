export type BodyWeightTrendDirection =
  'INCREASING' | 'DECREASING' | 'STABLE' | 'INSUFFICIENT_DATA'

export type StrengthSourceType = 'EXERCISE' | 'CUSTOM_MACHINE'

export type DashboardMuscleGroup =
  | 'CHEST'
  | 'BACK'
  | 'SHOULDERS'
  | 'BICEPS'
  | 'TRICEPS'
  | 'LEGS'
  | 'CORE'
  | 'GLUTES'
  | 'LOWER_BACK'
  | 'FULL_BODY'

export interface DashboardLastWorkout {
  id: string
  startedAt: string
  completedAt: string
  durationMinutes: number
}

export interface DashboardWeeklyProgress {
  completedWorkouts: number
  previousWeekCompletedWorkouts: number
  percentageChange: number | null
}

export interface BodyWeightPoint {
  date: string
  weightKg: number
}

export interface BodyWeightTrend {
  direction: BodyWeightTrendDirection
  changeKg: number | null
  percentageChange: number | null
}

export interface StrengthPoint {
  date: string
  weightKg: number
}

export interface StrengthProgressItem {
  sourceType: StrengthSourceType
  sourceId: string
  name: string
  imageUrl: string | null
  targetMuscle: DashboardMuscleGroup
  personalRecordKg: number
  latestWeightKg: number
  previousWeightKg: number | null
  changeKg: number | null
  percentageChange: number | null
  totalSessions: number
  points: StrengthPoint[]
}

export interface DashboardSummaryData {
  user: {
    firstName: string
  }
  overview: {
    currentBodyWeightKg: number | null
    dailyCalories: number | null
    currentWorkoutStreak: number
    workoutsCompleted: number
    lastWorkout: DashboardLastWorkout | null
    weeklyProgress: DashboardWeeklyProgress
  }
  bodyWeightProgress: {
    points: BodyWeightPoint[]
    trend: BodyWeightTrend
  }
  strengthProgress: {
    machines: StrengthProgressItem[]
  }
  meta: {
    generatedAt: string
    bodyWeightDataAvailable: boolean
    strengthDataAvailable: boolean
  }
}

export interface DashboardSummaryResponse {
  success: true
  data: DashboardSummaryData
}
