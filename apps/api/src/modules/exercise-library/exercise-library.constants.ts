import {
  DifficultyLevel,
  EquipmentType,
  MovementType,
  MuscleGroup,
  MuscleSubgroup,
} from '../../generated/prisma/client.js'

export const EXERCISE_LIMITS = {
  name: 120,
  slug: 150,
  description: 2_000,
  instruction: 1_000,
  instructionItems: 50,
  recommendedReps: 100,
  mediaUrl: 2_048,
  search: 100,
  defaultPageSize: 20,
  maximumPageSize: 100,
  defaultOptionLimit: 20,
  maximumOptionLimit: 50,
} as const

export const MUSCLE_SUBGROUPS_BY_PRIMARY = {
  [MuscleGroup.CHEST]: [
    MuscleSubgroup.UPPER_CHEST,
    MuscleSubgroup.MIDDLE_CHEST,
    MuscleSubgroup.LOWER_CHEST,
    MuscleSubgroup.ALL_CHEST,
  ],
  [MuscleGroup.BACK]: [
    MuscleSubgroup.LATS,
    MuscleSubgroup.UPPER_BACK,
    MuscleSubgroup.MIDDLE_BACK,
    MuscleSubgroup.TRAPS,
    MuscleSubgroup.ALL_BACK,
  ],
  [MuscleGroup.SHOULDERS]: [
    MuscleSubgroup.FRONT_DELTS,
    MuscleSubgroup.SIDE_DELTS,
    MuscleSubgroup.REAR_DELTS,
    MuscleSubgroup.ALL_SHOULDERS,
  ],
  [MuscleGroup.BICEPS]: [
    MuscleSubgroup.BICEPS_LONG_HEAD,
    MuscleSubgroup.BICEPS_SHORT_HEAD,
    MuscleSubgroup.BRACHIALIS,
    MuscleSubgroup.ALL_BICEPS,
  ],
  [MuscleGroup.TRICEPS]: [
    MuscleSubgroup.TRICEPS_LONG_HEAD,
    MuscleSubgroup.TRICEPS_LATERAL_HEAD,
    MuscleSubgroup.TRICEPS_MEDIAL_HEAD,
    MuscleSubgroup.ALL_TRICEPS,
  ],
  [MuscleGroup.LEGS]: [
    MuscleSubgroup.QUADRICEPS,
    MuscleSubgroup.HAMSTRINGS,
    MuscleSubgroup.CALVES,
    MuscleSubgroup.ADDUCTORS,
    MuscleSubgroup.ALL_LEGS,
  ],
  [MuscleGroup.CORE]: [
    MuscleSubgroup.UPPER_ABS,
    MuscleSubgroup.LOWER_ABS,
    MuscleSubgroup.OBLIQUES,
    MuscleSubgroup.DEEP_CORE,
    MuscleSubgroup.ALL_CORE,
  ],
  [MuscleGroup.GLUTES]: [
    MuscleSubgroup.GLUTE_MAXIMUS,
    MuscleSubgroup.GLUTE_MEDIUS,
    MuscleSubgroup.GLUTE_MINIMUS,
    MuscleSubgroup.ALL_GLUTES,
  ],
  [MuscleGroup.LOWER_BACK]: [
    MuscleSubgroup.ERECTOR_SPINAE,
    MuscleSubgroup.ALL_LOWER_BACK,
  ],
  [MuscleGroup.FULL_BODY]: [MuscleSubgroup.ALL_FULL_BODY],
} as const satisfies Record<MuscleGroup, readonly MuscleSubgroup[]>

export const EXERCISE_FILTER_OPTIONS = {
  primaryMuscles: Object.values(MuscleGroup),
  muscleSubgroups: Object.values(MuscleSubgroup),
  muscleSubgroupsByPrimaryMuscle: MUSCLE_SUBGROUPS_BY_PRIMARY,
  equipmentTypes: Object.values(EquipmentType),
  difficultyLevels: Object.values(DifficultyLevel),
  movementTypes: Object.values(MovementType),
}

export const EXERCISE_NOT_FOUND = 'Resource not found'
export const EXERCISE_DELETE_CONFLICT =
  'Exercise is referenced by workout history or a workout plan; unpublish it instead'
