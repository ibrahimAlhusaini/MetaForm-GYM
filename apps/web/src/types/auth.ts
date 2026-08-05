import { z } from 'zod'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
}

const userRoleSchema = z.enum(['USER', 'ADMIN'])
const nullableMeasurementSchema = z.union([z.string(), z.number()]).nullable()

const authUserSummarySchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: userRoleSchema,
  profile: z.object({ fullName: z.string() }).nullable(),
})

export const authenticatedUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: userRoleSchema,
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
  profile: z
    .object({
      fullName: z.string(),
      profileImageUrl: z.url().nullable(),
      gender: z.enum(['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY']).nullable(),
      heightCm: nullableMeasurementSchema,
      currentWeightKg: nullableMeasurementSchema,
      birthDate: z.iso.datetime().nullable(),
      fitnessGoal: z
        .enum([
          'BUILD_MUSCLE',
          'LOSE_FAT',
          'MAINTAIN_WEIGHT',
          'IMPROVE_STRENGTH',
          'GENERAL_FITNESS',
        ])
        .nullable(),
      activityLevel: z
        .enum([
          'SEDENTARY',
          'LIGHT',
          'MODERATE',
          'VERY_ACTIVE',
          'EXTREMELY_ACTIVE',
        ])
        .nullable(),
    })
    .nullable(),
})

export const authResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    user: authUserSummarySchema,
    accessToken: z.string().min(1),
  }),
})

export const currentUserResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ user: authenticatedUserSchema }),
})

export const refreshResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({ accessToken: z.string().min(1) }),
})

export const apiErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
})

export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type CurrentUserResponse = z.infer<typeof currentUserResponseSchema>
export type RefreshResponse = z.infer<typeof refreshResponseSchema>
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>
