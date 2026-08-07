import type {
  NutritionActivityLevel,
  NutritionBmiCategory,
  NutritionBmrFormula,
  NutritionFitnessGoal,
  NutritionInputSource,
} from '@metaform/shared-types'
import i18n from '../../../i18n/index.js'
import {
  activityLabel,
  bmiCategoryLabel,
  bmrFormulaLabel,
  fitnessGoalLabel,
  inputSourceLabel,
} from '../../../i18n/enum-labels.js'
import { localeForLanguage } from '../../../i18n/locale.js'

const locale = () => localeForLanguage(i18n.resolvedLanguage ?? i18n.language)
const number = (value: number, digits: number) =>
  new Intl.NumberFormat(locale(), { maximumFractionDigits: digits }).format(
    value,
  )
const unit = (key: string, value: number, digits: number) =>
  i18n.t(`units.${key}`, { ns: 'common', value: number(value, digits) })

export const formatCalories = (value: number): string =>
  unit('kcalPerDay', value, 0)
export const formatGrams = (value: number): string =>
  unit('gramsPerDay', value, 0)
export const formatLiters = (value: number): string =>
  unit('litersPerDay', value, 2)
export const formatWeight = (value: number): string => unit('kg', value, 2)
export const formatHeight = (value: number): string => unit('cm', value, 2)
export const formatBmi = (value: number): string => number(value, 2)
export const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat(locale(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
export const formatActivity = (value: NutritionActivityLevel): string =>
  activityLabel(i18n.t, value)
export const formatGoal = (value: NutritionFitnessGoal): string =>
  fitnessGoalLabel(i18n.t, value)
export const formatBmiCategory = (value: NutritionBmiCategory): string =>
  bmiCategoryLabel(i18n.t, value)
export const formatInputSource = (value: NutritionInputSource): string =>
  inputSourceLabel(i18n.t, value)
export const formatBmrFormula = (value: NutritionBmrFormula): string =>
  bmrFormulaLabel(i18n.t, value)
