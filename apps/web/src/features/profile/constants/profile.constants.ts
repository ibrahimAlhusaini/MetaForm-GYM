import type { ProfileCompletenessFields } from '@metaform/shared-types'

export const PROFILE_LIMITS = {
  fullNameMinimumLength: 2,
  fullNameMaximumLength: 100,
  minimumAge: 14,
  maximumAge: 100,
  minimumHeightCm: 100,
  maximumHeightCm: 250,
  minimumWeightKg: 30,
  maximumWeightKg: 350,
} as const

export const profileFieldKeys: (keyof ProfileCompletenessFields)[] = [
  'fullName',
  'birthDate',
  'gender',
  'heightCm',
  'currentWeightKg',
  'activityLevel',
  'fitnessGoal',
]
