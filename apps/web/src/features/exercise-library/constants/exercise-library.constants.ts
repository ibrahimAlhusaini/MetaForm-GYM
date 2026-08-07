import type {
  ExerciseDifficultyLevel,
  ExerciseEquipmentType,
  ExerciseMovementType,
  ExerciseMuscleSubgroup,
} from '@metaform/shared-types'

export const EXERCISE_PAGE_SIZE = 12
export const EXERCISE_OPTION_LIMIT = 20
export const EXERCISE_SEARCH_DEBOUNCE_MS = 300

export const equipmentLabels: Record<ExerciseEquipmentType, string> = {
  MACHINE: 'Machine',
  DUMBBELL: 'Dumbbell',
  BARBELL: 'Barbell',
  CABLE: 'Cable',
  BODYWEIGHT: 'Bodyweight',
  OTHER: 'Other',
}

export const difficultyLabels: Record<ExerciseDifficultyLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
}

export const movementLabels: Record<ExerciseMovementType, string> = {
  COMPOUND: 'Compound',
  ISOLATION: 'Isolation',
}

export const subgroupLabels: Record<ExerciseMuscleSubgroup, string> = {
  UPPER_CHEST: 'Upper chest',
  MIDDLE_CHEST: 'Middle chest',
  LOWER_CHEST: 'Lower chest',
  ALL_CHEST: 'All chest',
  LATS: 'Lats',
  UPPER_BACK: 'Upper back',
  MIDDLE_BACK: 'Middle back',
  TRAPS: 'Traps',
  ALL_BACK: 'All back',
  FRONT_DELTS: 'Front delts',
  SIDE_DELTS: 'Side delts',
  REAR_DELTS: 'Rear delts',
  ALL_SHOULDERS: 'All shoulders',
  BICEPS_LONG_HEAD: 'Biceps long head',
  BICEPS_SHORT_HEAD: 'Biceps short head',
  BRACHIALIS: 'Brachialis',
  ALL_BICEPS: 'All biceps',
  TRICEPS_LONG_HEAD: 'Triceps long head',
  TRICEPS_LATERAL_HEAD: 'Triceps lateral head',
  TRICEPS_MEDIAL_HEAD: 'Triceps medial head',
  ALL_TRICEPS: 'All triceps',
  QUADRICEPS: 'Quadriceps',
  HAMSTRINGS: 'Hamstrings',
  CALVES: 'Calves',
  ADDUCTORS: 'Adductors',
  ALL_LEGS: 'All legs',
  UPPER_ABS: 'Upper abs',
  LOWER_ABS: 'Lower abs',
  OBLIQUES: 'Obliques',
  DEEP_CORE: 'Deep core',
  ALL_CORE: 'All core',
  GLUTE_MAXIMUS: 'Glute maximus',
  GLUTE_MEDIUS: 'Glute medius',
  GLUTE_MINIMUS: 'Glute minimus',
  ALL_GLUTES: 'All glutes',
  ERECTOR_SPINAE: 'Erector spinae',
  ALL_LOWER_BACK: 'All lower back',
  ALL_FULL_BODY: 'All full body',
}

export const sortLabels = {
  'name-asc': 'Name: A to Z',
  'name-desc': 'Name: Z to A',
  'updatedAt-desc': 'Recently updated',
  'createdAt-desc': 'Recently added',
} as const

export const sortOptions = Object.entries(sortLabels).map(([value, label]) => ({
  value,
  label,
}))

export const paginationLabels = {
  previous: 'Previous page',
  next: 'Next page',
} as const
