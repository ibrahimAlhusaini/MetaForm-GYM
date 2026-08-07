import type { TFunction } from 'i18next'
import { z } from 'zod'
import {
  activityValues,
  genderValues,
  goalValues,
} from '../../../i18n/enum-values.js'
import { PROFILE_LIMITS } from '../constants/profile.constants.js'

const validDateOnly = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year ?? 0, (month ?? 0) - 1, day ?? 0))
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === (month ?? 0) - 1 &&
    parsed.getUTCDate() === day
  )
}

const dateOnly = (date: Date): string => date.toISOString().slice(0, 10)

const birthDateInRange = (value: string, now = new Date()): boolean => {
  if (!validDateOnly(value)) return false
  const latest = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  latest.setUTCFullYear(latest.getUTCFullYear() - PROFILE_LIMITS.minimumAge)
  const oldestExcluded = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  oldestExcluded.setUTCFullYear(
    oldestExcluded.getUTCFullYear() - PROFILE_LIMITS.maximumAge - 1,
  )
  return value <= dateOnly(latest) && value > dateOnly(oldestExcluded)
}

const nullableNumber = (
  t: TFunction,
  label: string,
  minimum: number,
  maximum: number,
) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === '' || Number.isFinite(Number(value)),
      t('common:validation.number', { field: label }),
    )
    .refine(
      (value) =>
        value === '' || (Number(value) >= minimum && Number(value) <= maximum),
      t('common:validation.range', { field: label, minimum, maximum }),
    )

export const createProfileFormSchema = (t: TFunction) =>
  z.object({
    fullName: z
      .string()
      .trim()
      .min(1, t('common:validation.required', { field: t('form.fullName') }))
      .min(PROFILE_LIMITS.fullNameMinimumLength, t('validation.nameLength'))
      .max(PROFILE_LIMITS.fullNameMaximumLength, t('validation.nameLength')),
    birthDate: z
      .string()
      .refine(
        (value) => value === '' || validDateOnly(value),
        t('validation.birthDateInvalid'),
      )
      .refine(
        (value) => value === '' || birthDateInRange(value),
        t('validation.birthDateRange'),
      ),
    gender: z.enum(['', ...genderValues]),
    heightCm: nullableNumber(
      t,
      t('form.height'),
      PROFILE_LIMITS.minimumHeightCm,
      PROFILE_LIMITS.maximumHeightCm,
    ),
    currentWeightKg: nullableNumber(
      t,
      t('form.weight'),
      PROFILE_LIMITS.minimumWeightKg,
      PROFILE_LIMITS.maximumWeightKg,
    ),
    activityLevel: z.enum(['', ...activityValues]),
    fitnessGoal: z.enum(['', ...goalValues]),
  })
