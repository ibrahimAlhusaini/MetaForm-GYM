import type {
  NutritionHistoryItem,
  NutritionMethodology,
} from '@metaform/shared-types'
import type { Prisma } from '../../generated/prisma/client.js'
import { bmiCategoryFor } from './nutrition.calculator.js'

export const nutritionCalculationSelect = {
  id: true,
  bmi: true,
  bmr: true,
  tdee: true,
  maintenanceCalories: true,
  bulkingCalories: true,
  cuttingCalories: true,
  proteinGrams: true,
  carbohydrateGrams: true,
  fatGrams: true,
  waterLiters: true,
  age: true,
  gender: true,
  heightCm: true,
  weightKg: true,
  activityLevel: true,
  fitnessGoal: true,
  recommendedCalories: true,
  bmiCategory: true,
  bmrFormula: true,
  calculationVersion: true,
  safetyFloorApplied: true,
  macroFallbackApplied: true,
  calculatedAt: true,
} satisfies Prisma.NutritionCalculationSelect

export type NutritionCalculationRow = Prisma.NutritionCalculationGetPayload<{
  select: typeof nutritionCalculationSelect
}>

export const decimalToNumber = (value: { toNumber: () => number }): number => {
  const converted = value.toNumber()
  if (!Number.isFinite(converted))
    throw new Error('Stored nutrition value is not finite')
  return converted
}

const mapInputs = (row: NutritionCalculationRow) => {
  if (
    row.age === null ||
    (row.gender !== 'MALE' && row.gender !== 'FEMALE') ||
    row.heightCm === null ||
    row.weightKg === null ||
    row.activityLevel === null ||
    row.fitnessGoal === null
  )
    return null
  return {
    age: row.age,
    gender: row.gender,
    heightCm: decimalToNumber(row.heightCm),
    weightKg: decimalToNumber(row.weightKg),
    activityLevel: row.activityLevel,
    goal: row.fitnessGoal,
  }
}

const mapMethodology = (
  row: NutritionCalculationRow,
): NutritionMethodology | null => {
  if (!row.bmrFormula || !row.calculationVersion) return null
  return {
    bmrFormula: row.bmrFormula,
    calorieAdjustment: 'STANDARD',
    macroStrategy: 'GOAL_BASED',
    calculationVersion: row.calculationVersion,
  }
}

export const mapNutritionHistoryItem = (
  row: NutritionCalculationRow,
): NutritionHistoryItem => {
  const bmi = decimalToNumber(row.bmi)
  return {
    id: row.id,
    inputs: mapInputs(row),
    results: {
      bmi,
      bmiCategory: row.bmiCategory ?? bmiCategoryFor(bmi),
      bmr: Math.round(decimalToNumber(row.bmr)),
      tdee: Math.round(decimalToNumber(row.tdee)),
      maintenanceCalories: row.maintenanceCalories,
      bulkingCalories: row.bulkingCalories,
      cuttingCalories: row.cuttingCalories,
      recommendedCalories: row.recommendedCalories,
      proteinGrams: Math.round(decimalToNumber(row.proteinGrams)),
      carbohydrateGrams: Math.round(decimalToNumber(row.carbohydrateGrams)),
      fatGrams: Math.round(decimalToNumber(row.fatGrams)),
      waterLiters: decimalToNumber(row.waterLiters),
      safetyFloorApplied: row.safetyFloorApplied,
      macroFallbackApplied: row.macroFallbackApplied,
    },
    methodology: mapMethodology(row),
    calculatedAt: row.calculatedAt.toISOString(),
  }
}
