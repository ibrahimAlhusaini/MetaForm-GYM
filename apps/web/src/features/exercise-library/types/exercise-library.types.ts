import type {
  ExerciseDifficultyLevel,
  ExerciseEquipmentType,
  ExerciseListItem,
  ExerciseMovementType,
  ExerciseMuscleSubgroup,
  ExercisePagination,
  ExercisePrimaryMuscle,
} from '@metaform/shared-types'

export interface ApiResponse<T> {
  success: true
  data: T
}

export type ExerciseSortValue =
  'name-asc' | 'name-desc' | 'updatedAt-desc' | 'createdAt-desc'

export interface ExerciseListQuery {
  page: number
  limit: number
  search?: string
  primaryMuscle?: ExercisePrimaryMuscle
  muscleSubgroup?: ExerciseMuscleSubgroup
  equipmentType?: ExerciseEquipmentType
  difficultyLevel?: ExerciseDifficultyLevel
  movementType?: ExerciseMovementType
  sortBy: 'name' | 'createdAt' | 'updatedAt'
  sortOrder: 'asc' | 'desc'
}

export interface ExerciseListData {
  items: ExerciseListItem[]
  pagination: ExercisePagination
}

export interface ExerciseOptionQuery {
  search?: string
  primaryMuscle?: ExercisePrimaryMuscle
  muscleSubgroup?: ExerciseMuscleSubgroup
  limit: number
}

export interface ExerciseFilterState {
  primaryMuscle: ExercisePrimaryMuscle | undefined
  muscleSubgroup: ExerciseMuscleSubgroup | undefined
  equipmentType: ExerciseEquipmentType | undefined
  difficultyLevel: ExerciseDifficultyLevel | undefined
  movementType: ExerciseMovementType | undefined
  sort: ExerciseSortValue
}
