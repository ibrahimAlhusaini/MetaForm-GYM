import { describe, expect, it } from 'vitest'
import type { NutritionCalculatorInput } from '../src/modules/nutrition/nutrition.types.js'
import {
  ageFromBirthDate,
  assertFiniteNutritionValues,
  bmiCategoryFor,
  calculateMacroTargets,
  calculateMifflinStJeorBmr,
  calculateNutritionTargets,
} from '../src/modules/nutrition/nutrition.calculator.js'
import { ACTIVITY_MULTIPLIERS } from '../src/modules/nutrition/nutrition.constants.js'

const baseInput: NutritionCalculatorInput = {
  age: 28,
  gender: 'MALE',
  heightCm: 178,
  weightKg: 82,
  activityLevel: 'MODERATE',
  goal: 'BUILD_MUSCLE',
}

describe('nutrition calculator', () => {
  it('calculates male and female Mifflin-St Jeor BMR', () => {
    expect(calculateMifflinStJeorBmr(82, 178, 28, 'MALE')).toBe(1797.5)
    expect(calculateMifflinStJeorBmr(82, 178, 28, 'FEMALE')).toBe(1631.5)
  })

  it('rejects a gender without the required sex-specific constant', () => {
    expect(() =>
      calculateMifflinStJeorBmr(82, 178, 28, 'PREFER_NOT_TO_SAY'),
    ).toThrow('requires MALE or FEMALE')
  })

  it('calculates completed UTC years without millisecond approximation', () => {
    expect(
      ageFromBirthDate(
        new Date('1998-08-08T00:00:00.000Z'),
        new Date('2026-08-07T23:59:59.000Z'),
      ),
    ).toBe(27)
  })

  it('calculates and rounds BMI', () => {
    expect(calculateNutritionTargets(baseInput).bmi).toBe(25.88)
  })

  it.each([
    [18.49, 'UNDERWEIGHT'],
    [18.5, 'NORMAL'],
    [24.99, 'NORMAL'],
    [25, 'OVERWEIGHT'],
    [29.99, 'OVERWEIGHT'],
    [30, 'OBESITY'],
  ] as const)('categorizes BMI %s as %s', (bmi, category) => {
    expect(bmiCategoryFor(bmi)).toBe(category)
  })

  it.each([
    'SEDENTARY',
    'LIGHT',
    'MODERATE',
    'VERY_ACTIVE',
    'EXTREMELY_ACTIVE',
  ] as const)('uses the %s activity multiplier', (activityLevel) => {
    const result = calculateNutritionTargets({
      ...baseInput,
      activityLevel,
    })
    expect(result.tdee).toBe(
      Math.round(1797.5 * ACTIVITY_MULTIPLIERS[activityLevel]),
    )
  })

  it('calculates maintenance, bulking, and cutting targets', () => {
    const result = calculateNutritionTargets(baseInput)
    expect(result.maintenanceCalories).toBe(result.tdee)
    expect(result.bulkingCalories).toBe(result.maintenanceCalories + 300)
    expect(result.cuttingCalories).toBe(result.maintenanceCalories - 500)
  })

  it.each([
    ['MALE', 1500],
    ['FEMALE', 1200],
  ] as const)('applies the %s cutting floor', (gender, floor) => {
    const result = calculateNutritionTargets({
      ...baseInput,
      age: 100,
      gender,
      heightCm: 100,
      weightKg: 30,
      activityLevel: 'SEDENTARY',
      goal: 'LOSE_FAT',
    })
    expect(result.cuttingCalories).toBe(floor)
    expect(result.safetyFloorApplied).toBe(true)
  })

  it.each([
    ['BUILD_MUSCLE', 300],
    ['IMPROVE_STRENGTH', 150],
    ['MAINTAIN_WEIGHT', 0],
    ['GENERAL_FITNESS', 0],
  ] as const)('maps %s to its calorie adjustment', (goal, adjustment) => {
    const result = calculateNutritionTargets({ ...baseInput, goal })
    expect(result.recommendedCalories).toBe(
      result.maintenanceCalories + adjustment,
    )
  })

  it('maps fat loss to the guarded cutting target', () => {
    const result = calculateNutritionTargets({
      ...baseInput,
      goal: 'LOSE_FAT',
    })
    expect(result.recommendedCalories).toBe(result.cuttingCalories)
  })

  it.each([
    ['BUILD_MUSCLE', 164],
    ['LOSE_FAT', 164],
    ['IMPROVE_STRENGTH', 148],
    ['MAINTAIN_WEIGHT', 131],
    ['GENERAL_FITNESS', 131],
  ] as const)('uses the %s protein coefficient', (goal, grams) => {
    expect(calculateNutritionTargets({ ...baseInput, goal }).proteinGrams).toBe(
      grams,
    )
  })

  it('calculates fat, remaining carbohydrates, and water', () => {
    const result = calculateNutritionTargets(baseInput)
    expect(result.fatGrams).toBe(66)
    expect(result.carbohydrateGrams).toBeGreaterThan(0)
    expect(result.waterLiters).toBe(2.87)
  })

  it('uses a proportional non-negative macro fallback', () => {
    const result = calculateMacroTargets(350, 'BUILD_MUSCLE', 500)
    expect(result.macroFallbackApplied).toBe(true)
    expect(result.carbohydrateGrams).toBeGreaterThanOrEqual(0)
    expect(result.proteinGrams * 4 + result.fatGrams * 9).toBeLessThanOrEqual(
      500,
    )
  })

  it('rejects non-finite outputs explicitly', () => {
    expect(() => {
      assertFiniteNutritionValues([1, Number.POSITIVE_INFINITY])
    }).toThrow('non-finite')
  })
})
