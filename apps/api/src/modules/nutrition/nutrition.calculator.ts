import type {
  NutritionBmiCategory,
  NutritionCalculationResults,
  NutritionFitnessGoal,
  NutritionGender,
} from '@metaform/shared-types'
import {
  ACTIVITY_MULTIPLIERS,
  BMI_BOUNDARIES,
  NUTRITION_COEFFICIENTS,
  PROTEIN_GRAMS_PER_KG,
} from './nutrition.constants.js'
import type { NutritionCalculatorInput } from './nutrition.types.js'

export const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export const assertFiniteNutritionValues = (
  values: readonly number[],
): void => {
  if (values.some((value) => !Number.isFinite(value)))
    throw new RangeError('Nutrition calculation produced a non-finite value')
}

export const ageFromBirthDate = (birthDate: Date, now = new Date()): number => {
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear()
  const birthdayPending =
    now.getUTCMonth() < birthDate.getUTCMonth() ||
    (now.getUTCMonth() === birthDate.getUTCMonth() &&
      now.getUTCDate() < birthDate.getUTCDate())
  if (birthdayPending) age -= 1
  return age
}

export const bmiCategoryFor = (bmi: number): NutritionBmiCategory => {
  if (bmi < BMI_BOUNDARIES.normal) return 'UNDERWEIGHT'
  if (bmi < BMI_BOUNDARIES.overweight) return 'NORMAL'
  if (bmi < BMI_BOUNDARIES.obesity) return 'OVERWEIGHT'
  return 'OBESITY'
}

const recommendedCaloriesFor = (
  goal: NutritionFitnessGoal,
  maintenance: number,
  bulking: number,
  cutting: number,
): number => {
  if (goal === 'BUILD_MUSCLE') return bulking
  if (goal === 'LOSE_FAT') return cutting
  if (goal === 'IMPROVE_STRENGTH')
    return maintenance + NUTRITION_COEFFICIENTS.strengthSurplus
  return maintenance
}

export const calculateMacroTargets = (
  weightKg: number,
  goal: NutritionFitnessGoal,
  recommendedCalories: number,
) => {
  const c = NUTRITION_COEFFICIENTS
  let proteinGrams = Math.round(weightKg * PROTEIN_GRAMS_PER_KG[goal])
  let fatGrams = Math.round(weightKg * c.fatGramsPerKg)
  const allocated =
    proteinGrams * c.proteinCaloriesPerGram + fatGrams * c.fatCaloriesPerGram
  const macroFallbackApplied = allocated > recommendedCalories
  if (macroFallbackApplied) {
    const scale = recommendedCalories / allocated
    proteinGrams = Math.floor(proteinGrams * scale)
    const caloriesAfterProtein =
      recommendedCalories - proteinGrams * c.proteinCaloriesPerGram
    fatGrams = Math.max(
      0,
      Math.floor(caloriesAfterProtein / c.fatCaloriesPerGram),
    )
  }
  const remaining =
    recommendedCalories -
    proteinGrams * c.proteinCaloriesPerGram -
    fatGrams * c.fatCaloriesPerGram
  const carbohydrateGrams = Math.max(
    0,
    Math.round(remaining / c.carbohydrateCaloriesPerGram),
  )
  return { proteinGrams, carbohydrateGrams, fatGrams, macroFallbackApplied }
}

export const calculateMifflinStJeorBmr = (
  weightKg: number,
  heightCm: number,
  age: number,
  gender: NutritionGender,
): number => {
  if (gender !== 'MALE' && gender !== 'FEMALE')
    throw new RangeError('Mifflin-St Jeor requires MALE or FEMALE')
  const c = NUTRITION_COEFFICIENTS
  const sexConstant =
    gender === 'MALE' ? c.maleBmrConstant : c.femaleBmrConstant
  return (
    c.bmrWeight * weightKg +
    c.bmrHeight * heightCm -
    c.bmrAge * age +
    sexConstant
  )
}

export const calculateNutritionTargets = (
  input: NutritionCalculatorInput,
): NutritionCalculationResults => {
  const c = NUTRITION_COEFFICIENTS
  const heightMeters = input.heightCm / 100
  const bmi = roundTo(input.weightKg / heightMeters ** 2, 2)
  const rawBmr = calculateMifflinStJeorBmr(
    input.weightKg,
    input.heightCm,
    input.age,
    input.gender,
  )
  const bmr = Math.round(rawBmr)
  const tdee = Math.round(rawBmr * ACTIVITY_MULTIPLIERS[input.activityLevel])
  const maintenanceCalories = tdee
  const bulkingCalories = maintenanceCalories + c.bulkingSurplus
  const calorieFloor =
    input.gender === 'MALE' ? c.maleCalorieFloor : c.femaleCalorieFloor
  const unguardedCut = maintenanceCalories - c.cuttingDeficit
  const cuttingCalories = Math.max(unguardedCut, calorieFloor)
  const safetyFloorApplied = cuttingCalories !== unguardedCut
  const recommendedCalories = recommendedCaloriesFor(
    input.goal,
    maintenanceCalories,
    bulkingCalories,
    cuttingCalories,
  )
  const macros = calculateMacroTargets(
    input.weightKg,
    input.goal,
    recommendedCalories,
  )
  const waterLiters = roundTo(input.weightKg * c.waterLitersPerKg, 2)
  const numericResults = [
    bmi,
    bmr,
    tdee,
    maintenanceCalories,
    bulkingCalories,
    cuttingCalories,
    recommendedCalories,
    macros.proteinGrams,
    macros.carbohydrateGrams,
    macros.fatGrams,
    waterLiters,
  ]
  assertFiniteNutritionValues(numericResults)
  return {
    bmi,
    bmiCategory: bmiCategoryFor(bmi),
    bmr,
    tdee,
    maintenanceCalories,
    bulkingCalories,
    cuttingCalories,
    recommendedCalories,
    ...macros,
    waterLiters,
    safetyFloorApplied,
  }
}
