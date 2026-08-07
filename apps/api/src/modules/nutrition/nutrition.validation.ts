import {
  ActivityLevel,
  FitnessGoal,
  Gender,
} from '../../generated/prisma/client.js'
import { z } from 'zod'
import { NUTRITION_LIMITS } from './nutrition.constants.js'

const measurement = (minimum: number, maximum: number) =>
  z.number().min(minimum).max(maximum).multipleOf(0.01)

export const calculateNutritionSchema = z
  .object({
    age: z
      .number()
      .int()
      .min(NUTRITION_LIMITS.minimumAge)
      .max(NUTRITION_LIMITS.maximumAge)
      .optional(),
    gender: z.enum(Gender).optional(),
    heightCm: measurement(
      NUTRITION_LIMITS.minimumHeightCm,
      NUTRITION_LIMITS.maximumHeightCm,
    ).optional(),
    weightKg: measurement(
      NUTRITION_LIMITS.minimumWeightKg,
      NUTRITION_LIMITS.maximumWeightKg,
    ).optional(),
    activityLevel: z.enum(ActivityLevel).optional(),
    goal: z.enum(FitnessGoal).optional(),
  })
  .strict()

const date = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value))

export const nutritionHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(NUTRITION_LIMITS.maximumHistoryLimit)
      .default(NUTRITION_LIMITS.defaultHistoryLimit),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    dateFrom: date.optional(),
    dateTo: date.optional(),
  })
  .strict()
  .refine(
    (value) =>
      !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
  )

export type CalculateNutritionInput = z.infer<typeof calculateNutritionSchema>
export type NutritionHistoryInput = z.infer<typeof nutritionHistoryQuerySchema>

export const resolvedNutritionSchema = z
  .object({
    age: z
      .number()
      .int()
      .min(NUTRITION_LIMITS.minimumAge)
      .max(NUTRITION_LIMITS.maximumAge),
    gender: z.enum(['MALE', 'FEMALE']),
    heightCm: measurement(
      NUTRITION_LIMITS.minimumHeightCm,
      NUTRITION_LIMITS.maximumHeightCm,
    ),
    weightKg: measurement(
      NUTRITION_LIMITS.minimumWeightKg,
      NUTRITION_LIMITS.maximumWeightKg,
    ),
    activityLevel: z.enum(ActivityLevel),
    goal: z.enum(FitnessGoal),
  })
  .strict()
