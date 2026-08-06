import { MuscleGroup } from '../../generated/prisma/client.js'
import { z } from 'zod'
import {
  DESCRIPTION_MAX_LENGTH,
  IMAGE_URL_MAX_LENGTH,
  MACHINE_NAME_MAX_LENGTH,
  MAX_DISTANCE_METERS,
  MAX_DURATION_SECONDS,
  MAX_LOGS_PER_SESSION,
  MAX_REPS,
  MAX_SETS_PER_LOG,
  MAX_WEIGHT_KG,
  NOTES_MAX_LENGTH,
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
} from './weight-tracker.constants.js'

const uuid = z.uuid()
const nullableText = (max: number) => z.string().trim().max(max).nullable()
const date = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value))
const nullableDate = date.nullable()
const decimal = (max: number) =>
  z.number().nonnegative().max(max).multipleOf(0.01)
const optionalNullable = <T extends z.ZodType>(schema: T) =>
  schema.nullable().optional()

export const idParamsSchema = (key: string) =>
  z.object({ [key]: uuid }).strict()

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION_MAX_LIMIT)
    .default(PAGINATION_DEFAULT_LIMIT),
}

export const createMachineSchema = z
  .object({
    name: z.string().trim().min(1).max(MACHINE_NAME_MAX_LENGTH),
    imageUrl: optionalNullable(z.url().max(IMAGE_URL_MAX_LENGTH)),
    targetMuscle: z.enum(MuscleGroup),
    description: optionalNullable(
      nullableText(DESCRIPTION_MAX_LENGTH).unwrap(),
    ),
  })
  .strict()

export const updateMachineSchema = createMachineSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0)

export const listMachinesQuerySchema = z
  .object({
    ...paginationFields,
    search: z.string().trim().min(1).max(MACHINE_NAME_MAX_LENGTH).optional(),
    targetMuscle: z.enum(MuscleGroup).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict()

const sessionFields = {
  startedAt: date.optional(),
  completedAt: nullableDate.optional(),
  notes: optionalNullable(z.string().trim().max(NOTES_MAX_LENGTH)),
  workoutPlanId: optionalNullable(uuid),
}

export const createSessionSchema = z.object(sessionFields).strict()
export const updateSessionSchema = createSessionSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0)
export const completeSessionSchema = z
  .object({ completedAt: date.optional() })
  .strict()

export const listSessionsQuerySchema = z
  .object({
    ...paginationFields,
    completed: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    dateFrom: date.optional(),
    dateTo: date.optional(),
    search: z.string().trim().min(1).max(NOTES_MAX_LENGTH).optional(),
    sortBy: z.enum(['startedAt', 'completedAt']).default('startedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict()
  .refine(
    (value) =>
      !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
  )

const logFields = {
  exerciseId: optionalNullable(uuid),
  customMachineId: optionalNullable(uuid),
  notes: optionalNullable(z.string().trim().max(NOTES_MAX_LENGTH)),
  orderIndex: z.number().int().nonnegative(),
}

export const createLogSchema = z
  .object(logFields)
  .strict()
  .refine(
    (value) => Boolean(value.exerciseId) !== Boolean(value.customMachineId),
  )
export const updateLogSchema = z
  .object({
    notes: optionalNullable(z.string().trim().max(NOTES_MAX_LENGTH)),
    orderIndex: z.number().int().nonnegative().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0)

const reorderItemSchema = z
  .object({ logId: uuid, orderIndex: z.number().int().nonnegative() })
  .strict()
const setReorderItemSchema = z
  .object({ setId: uuid, setNumber: z.number().int().positive() })
  .strict()
const uniquePositions = (
  items: readonly { orderIndex?: number; setNumber?: number }[],
) => {
  const values = items.map((item) => item.orderIndex ?? item.setNumber)
  return new Set(values).size === values.length
}
export const reorderLogsSchema = z
  .object({ items: z.array(reorderItemSchema).max(MAX_LOGS_PER_SESSION) })
  .strict()
  .refine((value) => uniquePositions(value.items))

const setFields = {
  setNumber: z.number().int().positive(),
  weightKg: optionalNullable(decimal(MAX_WEIGHT_KG)),
  reps: optionalNullable(z.number().int().nonnegative().max(MAX_REPS)),
  durationSeconds: optionalNullable(
    z.number().int().nonnegative().max(MAX_DURATION_SECONDS),
  ),
  distanceMeters: optionalNullable(decimal(MAX_DISTANCE_METERS)),
  isWarmup: z.boolean().optional().default(false),
}
const hasMetric = (value: {
  weightKg?: number | null | undefined
  reps?: number | null | undefined
  durationSeconds?: number | null | undefined
  distanceMeters?: number | null | undefined
}) =>
  [
    value.weightKg,
    value.reps,
    value.durationSeconds,
    value.distanceMeters,
  ].some((metric) => metric !== null && metric !== undefined)

export const createSetSchema = z.object(setFields).strict().refine(hasMetric)
export const updateSetSchema = z
  .object({
    ...setFields,
    setNumber: setFields.setNumber.optional(),
    isWarmup: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0)
export const reorderSetsSchema = z
  .object({ items: z.array(setReorderItemSchema).max(MAX_SETS_PER_LOG) })
  .strict()
  .refine((value) => uniquePositions(value.items))

const bulkSetSchema = createSetSchema
const bulkEntrySchema = z
  .object({
    ...logFields,
    sets: z
      .array(bulkSetSchema)
      .max(MAX_SETS_PER_LOG)
      .refine(
        (sets) =>
          new Set(sets.map((set) => set.setNumber)).size === sets.length,
      ),
  })
  .strict()
  .refine(
    (value) => Boolean(value.exerciseId) !== Boolean(value.customMachineId),
  )
export const createSessionWithEntriesSchema = z
  .object({
    ...sessionFields,
    entries: z
      .array(bulkEntrySchema)
      .max(MAX_LOGS_PER_SESSION)
      .refine(
        (entries) =>
          new Set(entries.map((entry) => entry.orderIndex)).size ===
          entries.length,
      ),
  })
  .strict()

export const historyParamsSchema = z
  .object({ sourceType: z.enum(['exercise', 'machine']), sourceId: uuid })
  .strict()
export const historyQuerySchema = z
  .object({
    ...paginationFields,
    dateFrom: date.optional(),
    dateTo: date.optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict()
  .refine(
    (value) =>
      !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
  )

export type CreateMachineInput = z.infer<typeof createMachineSchema>
export type UpdateMachineInput = z.infer<typeof updateMachineSchema>
export type ListMachinesQuery = z.infer<typeof listMachinesQuerySchema>
export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>
export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>
export type CreateLogInput = z.infer<typeof createLogSchema>
export type UpdateLogInput = z.infer<typeof updateLogSchema>
export type ReorderLogsInput = z.infer<typeof reorderLogsSchema>
export type CreateSetInput = z.infer<typeof createSetSchema>
export type UpdateSetInput = z.infer<typeof updateSetSchema>
export type ReorderSetsInput = z.infer<typeof reorderSetsSchema>
export type CreateSessionWithEntriesInput = z.infer<
  typeof createSessionWithEntriesSchema
>
export type HistoryParams = z.infer<typeof historyParamsSchema>
export type HistoryQuery = z.infer<typeof historyQuerySchema>
