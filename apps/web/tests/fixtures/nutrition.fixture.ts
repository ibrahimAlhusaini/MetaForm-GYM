import type {
  NutritionCalculationData,
  NutritionHistoryItem,
  NutritionPagination,
  NutritionProfileInputs,
} from '@metaform/shared-types'

export const completeNutritionProfile: NutritionProfileInputs = {
  age: 30,
  gender: 'MALE',
  heightCm: 180,
  weightKg: 82.5,
  activityLevel: 'MODERATE',
  goal: 'BUILD_MUSCLE',
  completeness: {
    age: true,
    gender: true,
    heightCm: true,
    weightKg: true,
    activityLevel: true,
    goal: true,
  },
}

export const incompleteNutritionProfile: NutritionProfileInputs = {
  ...completeNutritionProfile,
  age: null,
  activityLevel: null,
  completeness: {
    ...completeNutritionProfile.completeness,
    age: false,
    activityLevel: false,
  },
}

export const nutritionCalculation: NutritionCalculationData = {
  calculationId: 'nutrition-1',
  inputs: {
    age: 30,
    gender: 'MALE',
    heightCm: 180,
    weightKg: 82.5,
    activityLevel: 'MODERATE',
    goal: 'BUILD_MUSCLE',
    sources: {
      age: 'PROFILE',
      gender: 'PROFILE',
      heightCm: 'PROFILE',
      weightKg: 'PROFILE',
      activityLevel: 'PROFILE',
      goal: 'PROFILE',
    },
  },
  results: {
    bmi: 25.46,
    bmiCategory: 'OVERWEIGHT',
    bmr: 1804,
    tdee: 2796,
    maintenanceCalories: 2796,
    bulkingCalories: 3076,
    cuttingCalories: 2377,
    recommendedCalories: 3076,
    proteinGrams: 165,
    carbohydrateGrams: 395,
    fatGrams: 85,
    waterLiters: 3.2,
    safetyFloorApplied: true,
    macroFallbackApplied: true,
  },
  methodology: {
    bmrFormula: 'MIFFLIN_ST_JEOR',
    calorieAdjustment: 'STANDARD',
    macroStrategy: 'GOAL_BASED',
    calculationVersion: '1.0',
  },
  disclaimer: 'API estimate disclaimer.',
  calculatedAt: '2026-08-07T09:30:00.000Z',
}

export const nutritionHistoryItem: NutritionHistoryItem = {
  id: nutritionCalculation.calculationId,
  inputs: {
    age: nutritionCalculation.inputs.age,
    gender: nutritionCalculation.inputs.gender,
    heightCm: nutritionCalculation.inputs.heightCm,
    weightKg: nutritionCalculation.inputs.weightKg,
    activityLevel: nutritionCalculation.inputs.activityLevel,
    goal: nutritionCalculation.inputs.goal,
  },
  results: nutritionCalculation.results,
  methodology: nutritionCalculation.methodology,
  calculatedAt: nutritionCalculation.calculatedAt,
}

export const nutritionPagination: NutritionPagination = {
  page: 1,
  limit: 10,
  totalItems: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
}
