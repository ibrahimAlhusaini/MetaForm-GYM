import type {
  NutritionActivityLevel,
  NutritionBmiCategory,
  NutritionBmrFormula,
  NutritionFitnessGoal,
  NutritionInputSource,
} from '@metaform/shared-types'
import {
  activityOptions,
  bmiCategoryLabels,
  bmrFormulaLabels,
  goalOptions,
  inputSourceLabels,
} from '../constants/nutrition.constants.js'

const numberFormatter = (maximumFractionDigits: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits })

export const formatCalories = (value: number): string =>
  `${numberFormatter(0).format(value)} kcal/day`
export const formatGrams = (value: number): string =>
  `${numberFormatter(0).format(value)} g/day`
export const formatLiters = (value: number): string =>
  `${numberFormatter(2).format(value)} L/day`
export const formatWeight = (value: number): string =>
  `${numberFormatter(2).format(value)} kg`
export const formatHeight = (value: number): string =>
  `${numberFormatter(2).format(value)} cm`
export const formatBmi = (value: number): string =>
  numberFormatter(2).format(value)
export const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
export const formatActivity = (value: NutritionActivityLevel): string =>
  activityOptions.find((option) => option.value === value)?.label ?? value
export const formatGoal = (value: NutritionFitnessGoal): string =>
  goalOptions.find((option) => option.value === value)?.label ?? value
export const formatBmiCategory = (value: NutritionBmiCategory): string =>
  bmiCategoryLabels[value]
export const formatInputSource = (value: NutritionInputSource): string =>
  inputSourceLabels[value]
export const formatBmrFormula = (value: NutritionBmrFormula): string =>
  bmrFormulaLabels[value]
