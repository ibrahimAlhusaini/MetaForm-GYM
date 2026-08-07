import type { TFunction } from 'i18next'
import { z } from 'zod'

const normalizedEmailSchema = (t: TFunction) =>
  z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email(t('validation.emailInvalid')))

const passwordSchema = (t: TFunction) =>
  z
    .string()
    .min(10, t('validation.passwordMin'))
    .max(128, t('validation.passwordMax'))
    .regex(/[A-Z]/, t('validation.passwordUppercase'))
    .regex(/[a-z]/, t('validation.passwordLowercase'))
    .regex(/[0-9]/, t('validation.passwordNumber'))
    .regex(/[^A-Za-z0-9]/, t('validation.passwordSpecial'))

export const createLoginFormSchema = (t: TFunction) =>
  z.object({
    email: normalizedEmailSchema(t),
    password: z.string().min(1, t('validation.passwordRequired')),
  })

export const createRegistrationFormSchema = (t: TFunction) =>
  z
    .object({
      fullName: z
        .string()
        .trim()
        .min(2, t('validation.nameMin'))
        .max(100, t('validation.nameMax')),
      email: normalizedEmailSchema(t),
      password: passwordSchema(t),
      confirmPassword: z.string().min(1, t('validation.confirmRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsMismatch'),
      path: ['confirmPassword'],
    })

export type LoginFormValues = z.input<ReturnType<typeof createLoginFormSchema>>
export type RegistrationFormValues = z.input<
  ReturnType<typeof createRegistrationFormSchema>
>
