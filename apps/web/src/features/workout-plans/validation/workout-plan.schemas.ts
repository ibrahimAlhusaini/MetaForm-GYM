import { z } from 'zod'
import type { TFunction } from 'i18next'
import { MAX_PLAN_EXERCISES_PER_DAY } from '../constants/workout-plan.constants.js'

const weekdays = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const
const difficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const

const optionalInteger = (t: TFunction, maximum: number) =>
  z
    .string()
    .refine(
      (value) =>
        value.trim() === '' ||
        (Number.isInteger(Number(value)) &&
          Number(value) >= 0 &&
          Number(value) <= maximum),
      t('validation.integerRange', { maximum }),
    )

export const createPlanMetadataSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t('validation.nameRequired'))
      .max(120, t('validation.nameMax')),
    description: z.string().max(2000, t('validation.descriptionMax')),
    difficultyLevel: z.enum(difficulties, {
      error: t('validation.difficultyRequired'),
    }),
    isTemplate: z.boolean(),
  })

export const createPlanDraftSchema = (t: TFunction) => {
  const exercise = z.object({
    id: z.string().optional(),
    exercise: z
      .object({
        id: z.uuid(),
        name: z.string(),
        primaryMuscle: z.string(),
        muscleSubgroup: z.string().nullable(),
        equipmentType: z.string(),
        thumbnailUrl: z.string().nullable(),
      })
      .nullable()
      .refine((value) => value !== null, t('validation.exerciseRequired')),
    sets: optionalInteger(t, 100).refine(
      (value) => value.trim() === '' || Number(value) >= 1,
      t('validation.setsRange'),
    ),
    reps: z.string().max(80, t('validation.repsMax')),
    restSeconds: optionalInteger(t, 86400),
    notes: z.string().max(2000, t('validation.notesMax')),
  })
  const day = z
    .object({
      id: z.string().optional(),
      dayOfWeek: z.enum(weekdays),
      name: z.string().max(120, t('validation.dayNameMax')),
      notes: z.string().max(2000, t('validation.notesMax')),
      isRestDay: z.boolean(),
      exercises: z.array(exercise).max(
        MAX_PLAN_EXERCISES_PER_DAY,
        t('validation.exerciseLimit', {
          count: MAX_PLAN_EXERCISES_PER_DAY,
        }),
      ),
    })
    .refine((value) => !value.isRestDay || value.exercises.length === 0, {
      message: t('validation.restDayExercises'),
      path: ['exercises'],
    })
  return z
    .array(day)
    .max(weekdays.length, t('validation.dayLimit'))
    .superRefine((days, context) => {
      if (
        new Set(days.map((dayItem) => dayItem.dayOfWeek)).size !== days.length
      )
        context.addIssue({
          code: 'custom',
          message: t('validation.uniqueDays'),
        })
    })
}

export type PlanMetadataFormValues = z.infer<
  ReturnType<typeof createPlanMetadataSchema>
>
