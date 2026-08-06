import { z } from 'zod'
import {
  IMAGE_URL_MAX,
  MACHINE_NAME_MAX,
  MAX_LOGS_PER_SESSION,
  MAX_SETS_PER_LOG,
  TEXT_MAX,
  muscleGroups,
} from '../constants/weight-tracker.constants.js'

const optionalUrl = z
  .string()
  .trim()
  .max(IMAGE_URL_MAX)
  .refine(
    (value) => value === '' || z.url().safeParse(value).success,
    'Enter a valid URL',
  )
const optionalMetric = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0),
    'Enter zero or a positive number',
  )

export const machineFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Machine name is required')
    .max(MACHINE_NAME_MAX),
  imageUrl: optionalUrl,
  targetMuscle: z.enum(muscleGroups),
  description: z.string().trim().max(TEXT_MAX),
})

export const setDraftSchema = z
  .object({
    setNumber: z.coerce.number().int().positive('Set number must be positive'),
    weightKg: optionalMetric,
    reps: optionalMetric,
    durationSeconds: optionalMetric,
    distanceMeters: optionalMetric,
    isWarmup: z.boolean(),
  })
  .refine(
    (value) =>
      [
        value.weightKg,
        value.reps,
        value.durationSeconds,
        value.distanceMeters,
      ].some((metric) => metric !== ''),
    { message: 'Add at least one performance metric', path: ['weightKg'] },
  )

const entryDraftSchema = z
  .object({
    customMachineId: z.uuid('Choose a machine'),
    notes: z.string().trim().max(TEXT_MAX),
    sets: z
      .array(setDraftSchema)
      .min(1, 'Add at least one set')
      .max(MAX_SETS_PER_LOG),
  })
  .refine(
    (entry) =>
      new Set(entry.sets.map((set) => set.setNumber)).size ===
      entry.sets.length,
    { message: 'Set numbers must be unique', path: ['sets'] },
  )

export const sessionDraftSchema = z.object({
  startedAt: z.string().min(1, 'Start time is required'),
  notes: z.string().trim().max(TEXT_MAX),
  completeImmediately: z.boolean(),
  entries: z
    .array(entryDraftSchema)
    .min(1, 'Add at least one machine')
    .max(MAX_LOGS_PER_SESSION),
})

export const sessionMetadataSchema = z.object({
  startedAt: z.string().min(1),
  notes: z.string().trim().max(TEXT_MAX),
})
export type MachineFormValues = z.infer<typeof machineFormSchema>
export type SessionDraftValues = z.infer<typeof sessionDraftSchema>
