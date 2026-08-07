export type NutritionGender = 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY'
export type NutritionActivityLevel =
  'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'EXTREMELY_ACTIVE'
export type NutritionFitnessGoal =
  | 'BUILD_MUSCLE'
  | 'LOSE_FAT'
  | 'MAINTAIN_WEIGHT'
  | 'IMPROVE_STRENGTH'
  | 'GENERAL_FITNESS'
export type NutritionBmiCategory =
  'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESITY'
export type NutritionInputSource = 'REQUEST' | 'PROFILE'
export type NutritionBmrFormula = 'MIFFLIN_ST_JEOR'

export interface NutritionCalculationRequest {
  age?: number
  gender?: NutritionGender
  heightCm?: number
  weightKg?: number
  activityLevel?: NutritionActivityLevel
  goal?: NutritionFitnessGoal
}

export interface NutritionResolvedInputs {
  age: number
  gender: Exclude<NutritionGender, 'PREFER_NOT_TO_SAY'>
  heightCm: number
  weightKg: number
  activityLevel: NutritionActivityLevel
  goal: NutritionFitnessGoal
  sources: Record<
    'age' | 'gender' | 'heightCm' | 'weightKg' | 'activityLevel' | 'goal',
    NutritionInputSource
  >
}

export interface NutritionCalculationResults {
  bmi: number
  bmiCategory: NutritionBmiCategory
  bmr: number
  tdee: number
  maintenanceCalories: number
  bulkingCalories: number
  cuttingCalories: number
  recommendedCalories: number
  proteinGrams: number
  carbohydrateGrams: number
  fatGrams: number
  waterLiters: number
  safetyFloorApplied: boolean
  macroFallbackApplied: boolean
}

export interface NutritionMethodology {
  bmrFormula: NutritionBmrFormula
  calorieAdjustment: 'STANDARD'
  macroStrategy: 'GOAL_BASED'
  calculationVersion: string
}

export interface NutritionCalculationData {
  calculationId: string
  inputs: NutritionResolvedInputs
  results: NutritionCalculationResults
  methodology: NutritionMethodology
  disclaimer: string
  calculatedAt: string
}

export interface NutritionHistoryResults extends Omit<
  NutritionCalculationResults,
  'recommendedCalories' | 'safetyFloorApplied' | 'macroFallbackApplied'
> {
  recommendedCalories: number | null
  safetyFloorApplied: boolean | null
  macroFallbackApplied: boolean | null
}

export interface NutritionHistoryItem {
  id: string
  inputs: Omit<NutritionResolvedInputs, 'sources'> | null
  results: NutritionHistoryResults
  methodology: NutritionMethodology | null
  calculatedAt: string
}

export interface NutritionPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface NutritionProfileInputs {
  age: number | null
  gender: NutritionGender | null
  heightCm: number | null
  weightKg: number | null
  activityLevel: NutritionActivityLevel | null
  goal: NutritionFitnessGoal | null
  completeness: Record<
    'age' | 'gender' | 'heightCm' | 'weightKg' | 'activityLevel' | 'goal',
    boolean
  >
}

export interface NutritionCalculationResponse {
  success: true
  message: string
  data: NutritionCalculationData
}
export interface NutritionLatestResponse {
  success: true
  data: NutritionHistoryItem | null
}
export interface NutritionHistoryResponse {
  success: true
  data: { items: NutritionHistoryItem[]; pagination: NutritionPagination }
}
export interface NutritionProfileInputsResponse {
  success: true
  data: NutritionProfileInputs
}
