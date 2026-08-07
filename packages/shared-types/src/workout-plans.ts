import type {
  ExerciseDifficultyLevel,
  ExerciseEquipmentType,
  ExerciseMuscleSubgroup,
  ExercisePrimaryMuscle,
} from './exercise-library.js'

export type WorkoutPlanOwnershipType = 'USER' | 'SYSTEM' | 'PUBLIC'
export type WorkoutPlanTemplateType = 'SYSTEM_TEMPLATE' | 'USER_TEMPLATE'
export type WorkoutPlanDayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export interface WorkoutPlanStatistics {
  totalDays: number
  trainingDays: number
  restDays: number
  totalExercises: number
}

export interface WorkoutPlanSummary extends WorkoutPlanStatistics {
  id: string
  name: string
  description: string | null
  difficultyLevel: ExerciseDifficultyLevel
  isTemplate: boolean
  isPublic: boolean
  ownershipType: WorkoutPlanOwnershipType
  templateType: WorkoutPlanTemplateType | null
  createdAt: string
  updatedAt: string
}

export interface PlannedExerciseSummary {
  id: string
  name: string
  primaryMuscle: ExercisePrimaryMuscle
  muscleSubgroup: ExerciseMuscleSubgroup | null
  equipmentType: ExerciseEquipmentType
  thumbnailUrl: string | null
}

export interface WorkoutPlanExerciseItem {
  id: string
  exercise: PlannedExerciseSummary
  sets: number | null
  reps: string | null
  restSeconds: number | null
  notes: string | null
  orderIndex: number
}

export interface WorkoutPlanDayItem {
  id: string
  dayOfWeek: WorkoutPlanDayOfWeek
  name: string | null
  notes: string | null
  isRestDay: boolean
  orderIndex: number
  exercises: WorkoutPlanExerciseItem[]
}

export interface WorkoutPlanDetail extends WorkoutPlanSummary {
  days: WorkoutPlanDayItem[]
}

export interface WorkoutPlanPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface CreatePlannedExerciseRequest {
  exerciseId: string
  sets?: number | null
  reps?: string | null
  restSeconds?: number | null
  notes?: string | null
  orderIndex: number
}

export interface CreateWorkoutPlanDayRequest {
  dayOfWeek: WorkoutPlanDayOfWeek
  name?: string | null
  notes?: string | null
  isRestDay?: boolean
  orderIndex: number
  exercises?: CreatePlannedExerciseRequest[]
}

export interface UpdateWorkoutPlanDayRequest {
  dayOfWeek?: WorkoutPlanDayOfWeek
  name?: string | null
  notes?: string | null
  isRestDay?: boolean
  orderIndex?: number
}

export interface UpdatePlannedExerciseRequest {
  exerciseId?: string
  sets?: number | null
  reps?: string | null
  restSeconds?: number | null
  notes?: string | null
  orderIndex?: number
}

export interface ReorderWorkoutPlanDaysRequest {
  items: { dayId: string; orderIndex: number }[]
}

export interface ReorderPlannedExercisesRequest {
  items: { planExerciseId: string; orderIndex: number }[]
}

export interface CreateWorkoutPlanRequest {
  name: string
  description?: string | null
  difficultyLevel: ExerciseDifficultyLevel
  isTemplate?: boolean
  days?: CreateWorkoutPlanDayRequest[]
}

export interface UpdateWorkoutPlanRequest {
  name?: string
  description?: string | null
  difficultyLevel?: ExerciseDifficultyLevel
  isTemplate?: boolean
}

export interface CloneWorkoutPlanRequest {
  name?: string
}

export interface CreateSystemWorkoutPlanRequest extends CreateWorkoutPlanRequest {
  isPublic?: boolean
}

export interface WorkoutPlanListResponse {
  success: true
  data: { items: WorkoutPlanSummary[]; pagination: WorkoutPlanPagination }
}
export interface WorkoutPlanDetailResponse {
  success: true
  data: WorkoutPlanDetail
}
export interface WorkoutPlanMutationResponse {
  success: true
  data: WorkoutPlanDetail
}
