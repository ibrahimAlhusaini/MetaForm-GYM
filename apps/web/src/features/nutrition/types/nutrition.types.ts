import type {
  NutritionActivityLevel,
  NutritionFitnessGoal,
  NutritionGender,
} from '@metaform/shared-types'

export interface NutritionFormValues {
  age: string
  gender: NutritionGender | ''
  heightCm: string
  weightKg: string
  activityLevel: NutritionActivityLevel | ''
  goal: NutritionFitnessGoal | ''
}

export type NutritionDirtyFields = Partial<
  Record<keyof NutritionFormValues, boolean>
>

export interface NutritionHistoryQuery {
  page: number
  limit: number
  sortOrder: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
}

export interface NutritionDateFilters {
  dateFrom: string
  dateTo: string
}
