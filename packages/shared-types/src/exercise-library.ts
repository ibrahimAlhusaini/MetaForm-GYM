import type { DashboardMuscleGroup } from './dashboard.js'

export type ExercisePrimaryMuscle = DashboardMuscleGroup
export type ExerciseEquipmentType =
  'MACHINE' | 'DUMBBELL' | 'BARBELL' | 'CABLE' | 'BODYWEIGHT' | 'OTHER'
export type ExerciseDifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type ExerciseMovementType = 'COMPOUND' | 'ISOLATION'
export type ExerciseMuscleSubgroup =
  | 'UPPER_CHEST'
  | 'MIDDLE_CHEST'
  | 'LOWER_CHEST'
  | 'ALL_CHEST'
  | 'LATS'
  | 'UPPER_BACK'
  | 'MIDDLE_BACK'
  | 'TRAPS'
  | 'ALL_BACK'
  | 'FRONT_DELTS'
  | 'SIDE_DELTS'
  | 'REAR_DELTS'
  | 'ALL_SHOULDERS'
  | 'BICEPS_LONG_HEAD'
  | 'BICEPS_SHORT_HEAD'
  | 'BRACHIALIS'
  | 'ALL_BICEPS'
  | 'TRICEPS_LONG_HEAD'
  | 'TRICEPS_LATERAL_HEAD'
  | 'TRICEPS_MEDIAL_HEAD'
  | 'ALL_TRICEPS'
  | 'QUADRICEPS'
  | 'HAMSTRINGS'
  | 'CALVES'
  | 'ADDUCTORS'
  | 'ALL_LEGS'
  | 'UPPER_ABS'
  | 'LOWER_ABS'
  | 'OBLIQUES'
  | 'DEEP_CORE'
  | 'ALL_CORE'
  | 'GLUTE_MAXIMUS'
  | 'GLUTE_MEDIUS'
  | 'GLUTE_MINIMUS'
  | 'ALL_GLUTES'
  | 'ERECTOR_SPINAE'
  | 'ALL_LOWER_BACK'
  | 'ALL_FULL_BODY'

export interface ExerciseListItem {
  id: string
  name: string
  slug: string
  description: string | null
  primaryMuscle: ExercisePrimaryMuscle
  muscleSubgroup: ExerciseMuscleSubgroup | null
  secondaryMuscles: ExercisePrimaryMuscle[]
  equipmentType: ExerciseEquipmentType
  difficultyLevel: ExerciseDifficultyLevel
  movementType: ExerciseMovementType
  thumbnailUrl: string | null
  videoUrl: string | null
  recommendedSets: number | null
  recommendedReps: string | null
}

export interface ExerciseDetail extends ExerciseListItem {
  instructions: string[]
  commonMistakes: string[]
  isPublished?: boolean
  createdAt: string
  updatedAt: string
}

export interface ExerciseOption {
  id: string
  name: string
  primaryMuscle: ExercisePrimaryMuscle
  muscleSubgroup: ExerciseMuscleSubgroup | null
  equipmentType: ExerciseEquipmentType
  thumbnailUrl: string | null
}

export interface ExercisePagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ExerciseFilterOptions {
  primaryMuscles: ExercisePrimaryMuscle[]
  muscleSubgroups: ExerciseMuscleSubgroup[]
  muscleSubgroupsByPrimaryMuscle: Record<
    ExercisePrimaryMuscle,
    ExerciseMuscleSubgroup[]
  >
  equipmentTypes: ExerciseEquipmentType[]
  difficultyLevels: ExerciseDifficultyLevel[]
  movementTypes: ExerciseMovementType[]
}
