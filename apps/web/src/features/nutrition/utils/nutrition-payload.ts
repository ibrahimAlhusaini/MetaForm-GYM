import type {
  NutritionCalculationRequest,
  NutritionProfileInputs,
} from '@metaform/shared-types'
import type {
  NutritionDateFilters,
  NutritionDirtyFields,
  NutritionFormValues,
} from '../types/nutrition.types.js'

export const profileToFormValues = (
  profile: NutritionProfileInputs,
): NutritionFormValues => ({
  age: profile.age === null ? '' : String(profile.age),
  gender: profile.gender ?? '',
  heightCm: profile.heightCm === null ? '' : String(profile.heightCm),
  weightKg: profile.weightKg === null ? '' : String(profile.weightKg),
  activityLevel: profile.activityLevel ?? '',
  goal: profile.goal ?? '',
})

export const nutritionRequestFromForm = (
  values: NutritionFormValues,
  dirty: NutritionDirtyFields,
): NutritionCalculationRequest => ({
  ...(dirty.age ? { age: Number(values.age) } : {}),
  ...(dirty.gender && values.gender ? { gender: values.gender } : {}),
  ...(dirty.heightCm ? { heightCm: Number(values.heightCm) } : {}),
  ...(dirty.weightKg ? { weightKg: Number(values.weightKg) } : {}),
  ...(dirty.activityLevel && values.activityLevel
    ? { activityLevel: values.activityLevel }
    : {}),
  ...(dirty.goal && values.goal ? { goal: values.goal } : {}),
})

export const dateFiltersToQuery = (
  filters: NutritionDateFilters,
): { dateFrom?: string; dateTo?: string } => ({
  ...(filters.dateFrom
    ? { dateFrom: new Date(`${filters.dateFrom}T00:00:00.000Z`).toISOString() }
    : {}),
  ...(filters.dateTo
    ? { dateTo: new Date(`${filters.dateTo}T23:59:59.999Z`).toISOString() }
    : {}),
})
