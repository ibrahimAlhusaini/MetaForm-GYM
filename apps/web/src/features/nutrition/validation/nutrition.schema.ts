import { z } from 'zod'

const requiredNumber = (
  label: string,
  minimum: number,
  maximum: number,
  integer = false,
) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine(
      (value) => Number.isFinite(Number(value)),
      `${label} must be a number`,
    )
    .refine(
      (value) => Number(value) >= minimum && Number(value) <= maximum,
      `${label} must be between ${String(minimum)} and ${String(maximum)}`,
    )
    .refine(
      (value) => !integer || Number.isInteger(Number(value)),
      `${label} must be a whole number`,
    )

export const nutritionFormSchema = z.object({
  age: requiredNumber('Age', 14, 100, true),
  gender: z
    .enum(['', 'MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'])
    .refine((value) => value !== '', 'Gender is required')
    .refine(
      (value) => value !== 'PREFER_NOT_TO_SAY',
      'This formula requires a temporary male or female selection. Your profile preference will not change.',
    ),
  heightCm: requiredNumber('Height', 100, 250),
  weightKg: requiredNumber('Weight', 30, 350),
  activityLevel: z
    .enum([
      '',
      'SEDENTARY',
      'LIGHT',
      'MODERATE',
      'VERY_ACTIVE',
      'EXTREMELY_ACTIVE',
    ])
    .refine((value) => value !== '', 'Activity level is required'),
  goal: z
    .enum([
      '',
      'BUILD_MUSCLE',
      'LOSE_FAT',
      'MAINTAIN_WEIGHT',
      'IMPROVE_STRENGTH',
      'GENERAL_FITNESS',
    ])
    .refine((value) => value !== '', 'Fitness goal is required'),
})
