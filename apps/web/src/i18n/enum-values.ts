import type {
  NutritionActivityLevel,
  NutritionFitnessGoal,
  NutritionGender,
} from '@metaform/shared-types'

export const genderValues: NutritionGender[] = [
  'MALE',
  'FEMALE',
  'PREFER_NOT_TO_SAY',
]
export const activityValues: NutritionActivityLevel[] = [
  'SEDENTARY',
  'LIGHT',
  'MODERATE',
  'VERY_ACTIVE',
  'EXTREMELY_ACTIVE',
]
export const goalValues: NutritionFitnessGoal[] = [
  'BUILD_MUSCLE',
  'LOSE_FAT',
  'MAINTAIN_WEIGHT',
  'IMPROVE_STRENGTH',
  'GENERAL_FITNESS',
]
