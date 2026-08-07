import type {
  ExerciseDifficultyLevel,
  ExerciseOption,
  WorkoutPlanDayOfWeek,
  WorkoutPlanPagination,
  WorkoutPlanSummary,
} from '@metaform/shared-types'

export type PlanSortBy = 'name' | 'createdAt' | 'updatedAt'
export type SortOrder = 'asc' | 'desc'

export interface WorkoutPlanQuery {
  page: number
  limit: number
  search?: string
  difficultyLevel?: ExerciseDifficultyLevel
  isTemplate?: boolean
  ownership?: 'mine' | 'public' | 'all'
  sortBy: PlanSortBy
  sortOrder: SortOrder
}

export interface WorkoutPlanListData {
  items: WorkoutPlanSummary[]
  pagination: WorkoutPlanPagination
}

export interface PlannedExerciseDraft {
  id?: string
  exercise: ExerciseOption | null
  sets: string
  reps: string
  restSeconds: string
  notes: string
}

export interface PlanDayDraft {
  id?: string
  dayOfWeek: WorkoutPlanDayOfWeek
  name: string
  notes: string
  isRestDay: boolean
  exercises: PlannedExerciseDraft[]
}

export interface PlanMetadataValues {
  name: string
  description: string
  difficultyLevel: ExerciseDifficultyLevel
  isTemplate: boolean
}

export interface PlanFiltersState {
  search: string
  difficultyLevel: ExerciseDifficultyLevel | ''
  isTemplate: '' | 'true' | 'false'
  sortBy: PlanSortBy
  sortOrder: SortOrder
}
