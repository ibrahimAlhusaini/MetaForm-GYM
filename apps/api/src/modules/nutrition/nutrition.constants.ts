import type {
  NutritionActivityLevel,
  NutritionFitnessGoal,
} from '@metaform/shared-types'

export const NUTRITION_DISCLAIMER =
  'These estimates are for general fitness guidance and are not medical advice.'
export const CALCULATION_VERSION = '1.0'
export const BMR_FORMULA = 'MIFFLIN_ST_JEOR' as const

export const NUTRITION_LIMITS = {
  minimumAge: 14,
  maximumAge: 100,
  minimumHeightCm: 100,
  maximumHeightCm: 250,
  minimumWeightKg: 30,
  maximumWeightKg: 350,
  defaultHistoryLimit: 20,
  maximumHistoryLimit: 100,
} as const

export const ACTIVITY_MULTIPLIERS: Record<NutritionActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTREMELY_ACTIVE: 1.9,
}

export const PROTEIN_GRAMS_PER_KG: Record<NutritionFitnessGoal, number> = {
  BUILD_MUSCLE: 2,
  LOSE_FAT: 2,
  IMPROVE_STRENGTH: 1.8,
  MAINTAIN_WEIGHT: 1.6,
  GENERAL_FITNESS: 1.6,
}

export const NUTRITION_COEFFICIENTS = {
  bmrWeight: 10,
  bmrHeight: 6.25,
  bmrAge: 5,
  maleBmrConstant: 5,
  femaleBmrConstant: -161,
  bulkingSurplus: 300,
  cuttingDeficit: 500,
  strengthSurplus: 150,
  maleCalorieFloor: 1500,
  femaleCalorieFloor: 1200,
  fatGramsPerKg: 0.8,
  proteinCaloriesPerGram: 4,
  carbohydrateCaloriesPerGram: 4,
  fatCaloriesPerGram: 9,
  waterLitersPerKg: 0.035,
} as const

export const BMI_BOUNDARIES = {
  normal: 18.5,
  overweight: 25,
  obesity: 30,
} as const
