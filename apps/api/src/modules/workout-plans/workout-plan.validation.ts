import { DayOfWeek, DifficultyLevel } from '../../generated/prisma/client.js'
import { z } from 'zod'
import { WORKOUT_PLAN_LIMITS } from './workout-plan.constants.js'

const uuid = z.uuid()
const optionalNullableText = (maximum: number) =>
  z.preprocess(
    (value) => (value === '' ? null : value),
    z.string().trim().max(maximum).nullable().optional(),
  )
const orderIndex = z.number().int().min(0)
const pageFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(WORKOUT_PLAN_LIMITS.maximumPageSize)
    .default(WORKOUT_PLAN_LIMITS.defaultPageSize),
}
const booleanQuery = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')

export const planListQuerySchema = z
  .object({
    ...pageFields,
    search: z.string().trim().min(1).max(WORKOUT_PLAN_LIMITS.search).optional(),
    difficultyLevel: z.enum(DifficultyLevel).optional(),
    isTemplate: booleanQuery.optional(),
    ownership: z.enum(['mine', 'public', 'all']).default('all'),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict()

export const templateListQuerySchema = planListQuerySchema
  .omit({ isTemplate: true, ownership: true })
  .extend({
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('name'),
  })

const plannedExerciseFields = {
  exerciseId: uuid,
  sets: z
    .number()
    .int()
    .min(1)
    .max(WORKOUT_PLAN_LIMITS.maximumSets)
    .nullable()
    .optional(),
  reps: optionalNullableText(WORKOUT_PLAN_LIMITS.reps),
  restSeconds: z
    .number()
    .int()
    .min(0)
    .max(WORKOUT_PLAN_LIMITS.maximumRestSeconds)
    .nullable()
    .optional(),
  notes: optionalNullableText(WORKOUT_PLAN_LIMITS.notes),
  orderIndex,
}

export const createPlannedExerciseSchema = z
  .object(plannedExerciseFields)
  .strict()

const nestedDaySchema = z
  .object({
    dayOfWeek: z.enum(DayOfWeek),
    name: optionalNullableText(WORKOUT_PLAN_LIMITS.dayName),
    notes: optionalNullableText(WORKOUT_PLAN_LIMITS.notes),
    isRestDay: z.boolean().default(false),
    orderIndex,
    exercises: z
      .array(createPlannedExerciseSchema)
      .max(WORKOUT_PLAN_LIMITS.maximumExercisesPerDay)
      .default([]),
  })
  .strict()

const addDuplicateIssue = (
  values: readonly (string | number)[],
  path: (string | number)[],
  message: string,
  context: z.RefinementCtx,
) => {
  if (new Set(values).size !== values.length)
    context.addIssue({ code: 'custom', path, message })
}

const validateNestedDays = (
  value: { days?: z.infer<typeof nestedDaySchema>[] | undefined },
  context: z.RefinementCtx,
) => {
  const days = value.days ?? []
  addDuplicateIssue(
    days.map((day) => day.dayOfWeek),
    ['days'],
    'Each day of the week may appear only once',
    context,
  )
  addDuplicateIssue(
    days.map((day) => day.orderIndex),
    ['days'],
    'Day order positions must be unique',
    context,
  )
  days.forEach((day, dayIndex) => {
    if (day.isRestDay && day.exercises.length > 0)
      context.addIssue({
        code: 'custom',
        path: ['days', dayIndex, 'exercises'],
        message: 'Rest days cannot contain exercises',
      })
    addDuplicateIssue(
      day.exercises.map((exercise) => exercise.orderIndex),
      ['days', dayIndex, 'exercises'],
      'Exercise order positions must be unique within a day',
      context,
    )
  })
}

const createPlanFields = {
  name: z.string().trim().min(1).max(WORKOUT_PLAN_LIMITS.name),
  description: optionalNullableText(WORKOUT_PLAN_LIMITS.description),
  difficultyLevel: z.enum(DifficultyLevel),
  isTemplate: z.boolean().default(false),
  days: z
    .array(nestedDaySchema)
    .max(WORKOUT_PLAN_LIMITS.maximumDays)
    .default([]),
}

export const createWorkoutPlanSchema = z
  .object(createPlanFields)
  .strict()
  .superRefine(validateNestedDays)

export const createAdminWorkoutPlanSchema = z
  .object({ ...createPlanFields, isPublic: z.boolean().default(false) })
  .strict()
  .superRefine(validateNestedDays)

const updatePlanFields = {
  name: createPlanFields.name.optional(),
  description: createPlanFields.description,
  difficultyLevel: createPlanFields.difficultyLevel.optional(),
  isTemplate: z.boolean().optional(),
}
export const updateWorkoutPlanSchema = z
  .object(updatePlanFields)
  .strict()
  .refine((value) => Object.keys(value).length > 0)
export const updateAdminWorkoutPlanSchema = updateWorkoutPlanSchema

export const cloneWorkoutPlanSchema = z
  .object({ name: createPlanFields.name.optional() })
  .strict()

export const createPlanDaySchema = nestedDaySchema.omit({ exercises: true })
export const updatePlanDaySchema = createPlanDaySchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0)

export const updatePlannedExerciseSchema = createPlannedExerciseSchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0)

const addReorderIssues = (
  ids: readonly string[],
  positions: readonly number[],
  context: z.RefinementCtx,
) => {
  addDuplicateIssue(ids, ['items'], 'Reorder item IDs must be unique', context)
  addDuplicateIssue(
    positions,
    ['items'],
    'Reorder positions must be unique',
    context,
  )
}

export const reorderDaysSchema = z
  .object({
    items: z
      .array(z.object({ dayId: uuid, orderIndex }).strict())
      .min(1)
      .max(WORKOUT_PLAN_LIMITS.maximumDays),
  })
  .strict()
  .superRefine((value, context) => {
    addReorderIssues(
      value.items.map((item) => item.dayId),
      value.items.map((item) => item.orderIndex),
      context,
    )
  })

export const reorderExercisesSchema = z
  .object({
    items: z
      .array(z.object({ planExerciseId: uuid, orderIndex }).strict())
      .min(1)
      .max(WORKOUT_PLAN_LIMITS.maximumExercisesPerDay),
  })
  .strict()
  .superRefine((value, context) => {
    addReorderIssues(
      value.items.map((item) => item.planExerciseId),
      value.items.map((item) => item.orderIndex),
      context,
    )
  })

export const planIdParamsSchema = z.object({ planId: uuid }).strict()
export const dayIdParamsSchema = z.object({ dayId: uuid }).strict()
export const planExerciseIdParamsSchema = z
  .object({ planExerciseId: uuid })
  .strict()

export type PlanListQuery = z.infer<typeof planListQuerySchema>
export type TemplateListQuery = z.infer<typeof templateListQuerySchema>
export type CreateWorkoutPlanInput = z.infer<typeof createWorkoutPlanSchema>
export type CreateAdminWorkoutPlanInput = z.infer<
  typeof createAdminWorkoutPlanSchema
>
export type UpdateWorkoutPlanInput = z.infer<typeof updateWorkoutPlanSchema>
export type CloneWorkoutPlanInput = z.infer<typeof cloneWorkoutPlanSchema>
export type CreatePlanDayInput = z.infer<typeof createPlanDaySchema>
export type UpdatePlanDayInput = z.infer<typeof updatePlanDaySchema>
export type CreatePlannedExerciseInput = z.infer<
  typeof createPlannedExerciseSchema
>
export type UpdatePlannedExerciseInput = z.infer<
  typeof updatePlannedExerciseSchema
>
export type ReorderDaysInput = z.infer<typeof reorderDaysSchema>
export type ReorderExercisesInput = z.infer<typeof reorderExercisesSchema>
