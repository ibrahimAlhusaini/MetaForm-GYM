import type {
  NutritionActivityLevel,
  NutritionCalculationRequest,
  NutritionFitnessGoal,
  NutritionGender,
  NutritionResolvedInputs,
} from '@metaform/shared-types'

export type NutritionRequestInput = NutritionCalculationRequest
export type NutritionCalculatorInput = Omit<NutritionResolvedInputs, 'sources'>

export interface ProfileInputValues {
  age: number | null
  gender: NutritionGender | null
  heightCm: number | null
  weightKg: number | null
  activityLevel: NutritionActivityLevel | null
  goal: NutritionFitnessGoal | null
}

export interface NutritionHistoryQuery {
  page: number
  limit: number
  sortOrder: 'asc' | 'desc'
  dateFrom?: Date
  dateTo?: Date
}
