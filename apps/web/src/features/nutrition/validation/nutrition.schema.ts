import type { TFunction } from 'i18next'
import { z } from 'zod'

const requiredNumber = (
  t: TFunction,
  label: string,
  minimum: number,
  maximum: number,
  integer = false,
) =>
  z
    .string()
    .trim()
    .min(1, t('common:validation.required', { field: label }))
    .refine(
      (value) => Number.isFinite(Number(value)),
      t('common:validation.number', { field: label }),
    )
    .refine(
      (value) => Number(value) >= minimum && Number(value) <= maximum,
      t('common:validation.range', { field: label, minimum, maximum }),
    )
    .refine(
      (value) => !integer || Number.isInteger(Number(value)),
      t('common:validation.wholeNumber', { field: label }),
    )

export const createNutritionFormSchema = (t: TFunction) =>
  z.object({
    age: requiredNumber(t, t('nutrition:form.age'), 14, 100, true),
    gender: z
      .enum(['', 'MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'])
      .refine((value) => value !== '', t('nutrition:validation.genderRequired'))
      .refine(
        (value) => value !== 'PREFER_NOT_TO_SAY',
        t('nutrition:validation.temporaryGender'),
      ),
    heightCm: requiredNumber(t, t('nutrition:form.height'), 100, 250),
    weightKg: requiredNumber(t, t('nutrition:form.weight'), 30, 350),
    activityLevel: z
      .enum([
        '',
        'SEDENTARY',
        'LIGHT',
        'MODERATE',
        'VERY_ACTIVE',
        'EXTREMELY_ACTIVE',
      ])
      .refine(
        (value) => value !== '',
        t('nutrition:validation.activityRequired'),
      ),
    goal: z
      .enum([
        '',
        'BUILD_MUSCLE',
        'LOSE_FAT',
        'MAINTAIN_WEIGHT',
        'IMPROVE_STRENGTH',
        'GENERAL_FITNESS',
      ])
      .refine((value) => value !== '', t('nutrition:validation.goalRequired')),
  })
