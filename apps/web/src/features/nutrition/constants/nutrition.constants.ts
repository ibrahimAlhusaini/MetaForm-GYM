import type {
  NutritionActivityLevel,
  NutritionBmiCategory,
  NutritionBmrFormula,
  NutritionFitnessGoal,
  NutritionGender,
  NutritionInputSource,
} from '@metaform/shared-types'

export const NUTRITION_HISTORY_LIMIT = 10
export const HEALTH_DISCLAIMER =
  'These estimates are for general fitness guidance and are not medical advice.'
export const BMI_SCREENING_NOTE =
  'BMI is a general screening estimate and does not directly measure body composition.'

export const genderOptions: {
  value: NutritionGender
  label: string
}[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
]

export const activityOptions: {
  value: NutritionActivityLevel
  label: string
}[] = [
  { value: 'SEDENTARY', label: 'Sedentary' },
  { value: 'LIGHT', label: 'Lightly active' },
  { value: 'MODERATE', label: 'Moderately active' },
  { value: 'VERY_ACTIVE', label: 'Very active' },
  { value: 'EXTREMELY_ACTIVE', label: 'Extremely active' },
]

export const goalOptions: {
  value: NutritionFitnessGoal
  label: string
}[] = [
  { value: 'BUILD_MUSCLE', label: 'Build muscle' },
  { value: 'LOSE_FAT', label: 'Lose fat' },
  { value: 'MAINTAIN_WEIGHT', label: 'Maintain weight' },
  { value: 'IMPROVE_STRENGTH', label: 'Improve strength' },
  { value: 'GENERAL_FITNESS', label: 'General fitness' },
]

export const bmiCategoryLabels: Record<NutritionBmiCategory, string> = {
  UNDERWEIGHT: 'Underweight range',
  NORMAL: 'Normal range',
  OVERWEIGHT: 'Overweight range',
  OBESITY: 'Obesity range',
}

export const inputSourceLabels: Record<NutritionInputSource, string> = {
  PROFILE: 'From profile',
  REQUEST: 'Manually entered',
}

export const bmrFormulaLabels: Record<NutritionBmrFormula, string> = {
  MIFFLIN_ST_JEOR: 'Mifflin-St Jeor',
}
