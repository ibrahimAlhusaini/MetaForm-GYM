import type {
  NutritionActivityLevel,
  NutritionFitnessGoal,
  NutritionGender,
} from '@metaform/shared-types'

export interface ProfileFormValues {
  fullName: string
  birthDate: string
  gender: NutritionGender | ''
  heightCm: string
  currentWeightKg: string
  activityLevel: NutritionActivityLevel | ''
  fitnessGoal: NutritionFitnessGoal | ''
}

export type ProfileDirtyFields = Partial<
  Record<keyof ProfileFormValues, boolean>
>
