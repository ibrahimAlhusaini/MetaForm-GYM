import { z } from 'zod'
import {
  ActivityLevel,
  FitnessGoal,
  Gender,
} from '../../generated/prisma/client.js'
import { ageFromBirthDate } from '../../utils/age.js'
import { PROFILE_LIMITS } from './profile.constants.js'

const measurement = (minimum: number, maximum: number) =>
  z.number().min(minimum).max(maximum).multipleOf(0.01)

const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((value, context) => {
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(Date.UTC(year ?? 0, (month ?? 0) - 1, day ?? 0))
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== (month ?? 0) - 1 ||
      date.getUTCDate() !== day
    ) {
      context.addIssue({ code: 'custom', message: 'Invalid birth date' })
      return z.NEVER
    }
    const age = ageFromBirthDate(date)
    if (date > new Date() || age < PROFILE_LIMITS.minimumAge) {
      context.addIssue({ code: 'custom', message: 'Minimum age is 14' })
      return z.NEVER
    }
    if (age > PROFILE_LIMITS.maximumAge) {
      context.addIssue({ code: 'custom', message: 'Maximum age is 100' })
      return z.NEVER
    }
    return date
  })

export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(PROFILE_LIMITS.fullNameMinimumLength)
      .max(PROFILE_LIMITS.fullNameMaximumLength)
      .optional(),
    birthDate: birthDateSchema.nullable().optional(),
    gender: z.enum(Gender).nullable().optional(),
    heightCm: measurement(
      PROFILE_LIMITS.minimumHeightCm,
      PROFILE_LIMITS.maximumHeightCm,
    )
      .nullable()
      .optional(),
    currentWeightKg: measurement(
      PROFILE_LIMITS.minimumWeightKg,
      PROFILE_LIMITS.maximumWeightKg,
    )
      .nullable()
      .optional(),
    activityLevel: z.enum(ActivityLevel).nullable().optional(),
    fitnessGoal: z.enum(FitnessGoal).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0)

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
