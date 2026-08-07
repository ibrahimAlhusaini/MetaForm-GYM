import type {
  ExerciseDetail,
  ExerciseFilterOptions,
  ExerciseListItem,
  ExerciseOption,
} from '@metaform/shared-types'

export const exercise: ExerciseListItem = {
  id: '77777777-7777-4777-8777-777777777777',
  name: 'Incline Barbell Bench Press',
  slug: 'incline-barbell-bench-press',
  description: 'A controlled upper-chest pressing movement.',
  primaryMuscle: 'CHEST',
  muscleSubgroup: 'UPPER_CHEST',
  secondaryMuscles: ['TRICEPS', 'SHOULDERS'],
  equipmentType: 'BARBELL',
  difficultyLevel: 'INTERMEDIATE',
  movementType: 'COMPOUND',
  thumbnailUrl: 'https://cdn.example.com/incline-press.jpg',
  videoUrl: 'https://cdn.example.com/incline-press.mp4',
  recommendedSets: 4,
  recommendedReps: '8–12',
}

export const exerciseDetail: ExerciseDetail = {
  ...exercise,
  instructions: [
    'Set the bench to a low incline.',
    'Lower the bar with control.',
  ],
  commonMistakes: ['Flaring the elbows.', 'Using excessive incline.'],
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-02T10:00:00.000Z',
}

export const exerciseOption: ExerciseOption = {
  id: exercise.id,
  name: exercise.name,
  primaryMuscle: exercise.primaryMuscle,
  muscleSubgroup: exercise.muscleSubgroup,
  equipmentType: exercise.equipmentType,
  thumbnailUrl: exercise.thumbnailUrl,
}

export const exerciseFilterOptions: ExerciseFilterOptions = {
  primaryMuscles: ['CHEST', 'BACK'],
  muscleSubgroups: ['UPPER_CHEST', 'MIDDLE_CHEST', 'LATS', 'UPPER_BACK'],
  muscleSubgroupsByPrimaryMuscle: {
    CHEST: ['UPPER_CHEST', 'MIDDLE_CHEST'],
    BACK: ['LATS', 'UPPER_BACK'],
    SHOULDERS: [],
    BICEPS: [],
    TRICEPS: [],
    LEGS: [],
    CORE: [],
    GLUTES: [],
    LOWER_BACK: [],
    FULL_BODY: [],
  },
  equipmentTypes: ['BARBELL', 'DUMBBELL'],
  difficultyLevels: ['BEGINNER', 'INTERMEDIATE'],
  movementTypes: ['COMPOUND', 'ISOLATION'],
}

export const exercisePagination = {
  page: 1,
  limit: 12,
  totalItems: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
}
