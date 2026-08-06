export const PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
export const MAX_LOGS_PER_SESSION = 50
export const MAX_SETS_PER_LOG = 100
export const MACHINE_NAME_MAX = 120
export const TEXT_MAX = 2_000
export const IMAGE_URL_MAX = 2_048

export const muscleGroups = [
  'CHEST',
  'BACK',
  'SHOULDERS',
  'BICEPS',
  'TRICEPS',
  'LEGS',
  'CORE',
  'GLUTES',
  'LOWER_BACK',
  'FULL_BODY',
] as const

export const muscleLabels: Record<(typeof muscleGroups)[number], string> = {
  CHEST: 'Chest',
  BACK: 'Back',
  SHOULDERS: 'Shoulders',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  LEGS: 'Legs',
  CORE: 'Core',
  GLUTES: 'Glutes',
  LOWER_BACK: 'Lower back',
  FULL_BODY: 'Full body',
}
