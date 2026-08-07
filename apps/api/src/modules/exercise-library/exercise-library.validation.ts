import {
  DifficultyLevel,
  EquipmentType,
  MovementType,
  MuscleGroup,
  MuscleSubgroup,
} from '../../generated/prisma/client.js'
import { z } from 'zod'
import {
  EXERCISE_LIMITS,
  MUSCLE_SUBGROUPS_BY_PRIMARY,
} from './exercise-library.constants.js'
import { normalizeExerciseSlug } from './exercise-library.slug.js'

const uuid = z.uuid()
const pageFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(EXERCISE_LIMITS.maximumPageSize)
    .default(EXERCISE_LIMITS.defaultPageSize),
}
const httpUrl = z
  .url()
  .max(EXERCISE_LIMITS.mediaUrl)
  .refine((value) => {
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol)
    } catch {
      return false
    }
  })
const optionalNullableUrl = z.preprocess(
  (value) => (value === '' ? null : value),
  httpUrl.nullable().optional(),
)
const optionalNullableText = (maximum: number) =>
  z.preprocess(
    (value) => (value === '' ? null : value),
    z.string().trim().max(maximum).nullable().optional(),
  )
const contentItems = z
  .array(z.string().trim().min(1).max(EXERCISE_LIMITS.instruction))
  .max(EXERCISE_LIMITS.instructionItems)
const slug = z
  .string()
  .transform(normalizeExerciseSlug)
  .pipe(
    z
      .string()
      .min(2)
      .max(EXERCISE_LIMITS.slug)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  )

export const isCompatibleSubgroup = (
  primaryMuscle: MuscleGroup,
  muscleSubgroup: MuscleSubgroup,
): boolean =>
  MUSCLE_SUBGROUPS_BY_PRIMARY[primaryMuscle].some(
    (candidate) => candidate === muscleSubgroup,
  )

const addClassificationIssues = (
  value: {
    primaryMuscle?: MuscleGroup | undefined
    muscleSubgroup?: MuscleSubgroup | null | undefined
    secondaryMuscles?: MuscleGroup[] | undefined
  },
  context: z.RefinementCtx,
) => {
  if (
    value.primaryMuscle &&
    value.muscleSubgroup &&
    !isCompatibleSubgroup(value.primaryMuscle, value.muscleSubgroup)
  )
    context.addIssue({
      code: 'custom',
      path: ['muscleSubgroup'],
      message: 'Muscle subgroup is not compatible with primary muscle',
    })
  const secondary = value.secondaryMuscles ?? []
  if (new Set(secondary).size !== secondary.length)
    context.addIssue({
      code: 'custom',
      path: ['secondaryMuscles'],
      message: 'Secondary muscles must be unique',
    })
  if (value.primaryMuscle && secondary.includes(value.primaryMuscle))
    context.addIssue({
      code: 'custom',
      path: ['secondaryMuscles'],
      message: 'Primary muscle must not be repeated as a secondary muscle',
    })
}

const filterFields = {
  search: z.string().trim().min(1).max(EXERCISE_LIMITS.search).optional(),
  primaryMuscle: z.enum(MuscleGroup).optional(),
  muscleSubgroup: z.enum(MuscleSubgroup).optional(),
  secondaryMuscle: z.enum(MuscleGroup).optional(),
  equipmentType: z.enum(EquipmentType).optional(),
  difficultyLevel: z.enum(DifficultyLevel).optional(),
  movementType: z.enum(MovementType).optional(),
}

export const publicExerciseListQuerySchema = z
  .object({
    ...pageFields,
    ...filterFields,
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  })
  .strict()

export const exerciseOptionsQuerySchema = z
  .object({
    search: filterFields.search,
    primaryMuscle: filterFields.primaryMuscle,
    muscleSubgroup: filterFields.muscleSubgroup,
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(EXERCISE_LIMITS.maximumOptionLimit)
      .default(EXERCISE_LIMITS.defaultOptionLimit),
  })
  .strict()

export const adminExerciseListQuerySchema = z
  .object({
    ...pageFields,
    ...filterFields,
    isPublished: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict()

export const exerciseIdParamsSchema = z.object({ exerciseId: uuid }).strict()
export const exerciseSlugParamsSchema = z.object({ slug }).strict()

const createFields = {
  name: z.string().trim().min(2).max(EXERCISE_LIMITS.name),
  slug: slug.optional(),
  description: optionalNullableText(EXERCISE_LIMITS.description),
  primaryMuscle: z.enum(MuscleGroup),
  muscleSubgroup: z.enum(MuscleSubgroup),
  secondaryMuscles: z.array(z.enum(MuscleGroup)).default([]),
  equipmentType: z.enum(EquipmentType),
  difficultyLevel: z.enum(DifficultyLevel),
  movementType: z.enum(MovementType),
  instructions: contentItems.default([]),
  commonMistakes: contentItems.default([]),
  recommendedSets: z.number().int().min(1).max(100).nullable().optional(),
  recommendedReps: optionalNullableText(EXERCISE_LIMITS.recommendedReps),
  videoUrl: optionalNullableUrl,
  thumbnailUrl: optionalNullableUrl,
  isPublished: z.boolean().default(false),
}

export const createExerciseSchema = z
  .object(createFields)
  .strict()
  .superRefine(addClassificationIssues)

export const updateExerciseSchema = z
  .object({
    ...createFields,
    muscleSubgroup: z.enum(MuscleSubgroup).nullable().optional(),
    secondaryMuscles: z.array(z.enum(MuscleGroup)).optional(),
    instructions: contentItems.optional(),
    commonMistakes: contentItems.optional(),
    isPublished: z.never().optional(),
  })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0)
  .superRefine(addClassificationIssues)

export type PublicExerciseListQuery = z.infer<
  typeof publicExerciseListQuerySchema
>
export type ExerciseOptionsQuery = z.infer<typeof exerciseOptionsQuerySchema>
export type AdminExerciseListQuery = z.infer<
  typeof adminExerciseListQuerySchema
>
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>
