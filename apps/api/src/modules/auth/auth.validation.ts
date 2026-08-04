import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(10)
  .max(128)
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character')

const normalizedEmailSchema = z.string().trim().toLowerCase().pipe(z.email())

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    email: normalizedEmailSchema,
    password: passwordSchema,
  })
  .strict()

export const loginSchema = z
  .object({
    email: normalizedEmailSchema,
    password: z.string().min(1).max(128),
  })
  .strict()

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
