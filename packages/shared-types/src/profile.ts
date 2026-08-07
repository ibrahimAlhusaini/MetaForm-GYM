import type {
  NutritionActivityLevel,
  NutritionFitnessGoal,
  NutritionGender,
} from './nutrition.js'

export interface ProfileDetail {
  initialized: boolean
  fullName: string | null
  birthDate: string | null
  gender: NutritionGender | null
  heightCm: number | null
  currentWeightKg: number | null
  activityLevel: NutritionActivityLevel | null
  fitnessGoal: NutritionFitnessGoal | null
}

export interface ProfileUpdateRequest {
  fullName?: string
  birthDate?: string | null
  gender?: NutritionGender | null
  heightCm?: number | null
  currentWeightKg?: number | null
  activityLevel?: NutritionActivityLevel | null
  fitnessGoal?: NutritionFitnessGoal | null
}

export interface ProfileCompletenessFields {
  fullName: boolean
  birthDate: boolean
  gender: boolean
  heightCm: boolean
  currentWeightKg: boolean
  activityLevel: boolean
  fitnessGoal: boolean
}

export interface ProfileCompleteness {
  percentage: number
  complete: boolean
  fields: ProfileCompletenessFields
  missingFields: (keyof ProfileCompletenessFields)[]
}

export interface ProfileSummary {
  displayName: string | null
  age: number | null
  gender: NutritionGender | null
  heightCm: number | null
  currentWeightKg: number | null
  activityLevel: NutritionActivityLevel | null
  fitnessGoal: NutritionFitnessGoal | null
  completeness: Pick<ProfileCompleteness, 'percentage' | 'complete'>
}

export interface ProfileDetailResponse {
  success: true
  data: ProfileDetail
}

export interface ProfileUpdateResponse {
  success: true
  message: string
  data: ProfileDetail
}

export interface ProfileCompletenessResponse {
  success: true
  data: ProfileCompleteness
}

export interface ProfileSummaryResponse {
  success: true
  data: ProfileSummary
}
