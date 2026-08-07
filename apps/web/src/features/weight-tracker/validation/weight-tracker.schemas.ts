import type { TFunction } from 'i18next'
import { z } from 'zod'
import {
  IMAGE_URL_MAX,
  MACHINE_NAME_MAX,
  MAX_LOGS_PER_SESSION,
  MAX_SETS_PER_LOG,
  TEXT_MAX,
  muscleGroups,
} from '../constants/weight-tracker.constants.js'

const optionalUrl = (t: TFunction) =>
  z
    .string()
    .trim()
    .max(IMAGE_URL_MAX)
    .refine(
      (value) => value === '' || z.url().safeParse(value).success,
      t('common:validation.validUrl'),
    )
const optionalMetric = (t: TFunction) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0),
      t('common:validation.nonNegative'),
    )

export const createMachineFormSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t('weightTracker:validation.machineName'))
      .max(MACHINE_NAME_MAX),
    imageUrl: optionalUrl(t),
    targetMuscle: z.enum(muscleGroups),
    description: z.string().trim().max(TEXT_MAX),
  })
export const createSetDraftSchema = (t: TFunction) =>
  z
    .object({
      setNumber: z.coerce
        .number()
        .int()
        .positive(t('weightTracker:validation.setPositive')),
      weightKg: optionalMetric(t),
      reps: optionalMetric(t),
      durationSeconds: optionalMetric(t),
      distanceMeters: optionalMetric(t),
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
      { message: t('weightTracker:validation.metric'), path: ['weightKg'] },
    )
const createEntryDraftSchema = (t: TFunction) =>
  z
    .object({
      sourceType: z.enum(['exercise', 'machine']),
      exerciseId: z.string(),
      customMachineId: z.string(),
      notes: z.string().trim().max(TEXT_MAX),
      sets: z
        .array(createSetDraftSchema(t))
        .min(1, t('weightTracker:validation.oneSet'))
        .max(MAX_SETS_PER_LOG),
    })
    .superRefine((entry, context) => {
      const exerciseSelected = z.uuid().safeParse(entry.exerciseId).success
      const machineSelected = z.uuid().safeParse(entry.customMachineId).success
      if (entry.sourceType === 'exercise' && !exerciseSelected)
        context.addIssue({
          code: 'custom',
          path: ['exerciseId'],
          message: t('weightTracker:validation.chooseExercise'),
        })
      if (entry.sourceType === 'machine' && !machineSelected)
        context.addIssue({
          code: 'custom',
          path: ['customMachineId'],
          message: t('weightTracker:validation.chooseMachine'),
        })
      if (exerciseSelected === machineSelected)
        context.addIssue({
          code: 'custom',
          path: ['sourceType'],
          message: t('weightTracker:validation.exactlyOne'),
        })
    })
    .refine(
      (entry) =>
        new Set(entry.sets.map((set) => set.setNumber)).size ===
        entry.sets.length,
      { message: t('weightTracker:validation.uniqueSets'), path: ['sets'] },
    )
export const createSessionDraftSchema = (t: TFunction) =>
  z.object({
    startedAt: z.string().min(1, t('weightTracker:validation.startTime')),
    notes: z.string().trim().max(TEXT_MAX),
    completeImmediately: z.boolean(),
    entries: z
      .array(createEntryDraftSchema(t))
      .min(1, t('weightTracker:validation.oneExercise'))
      .max(MAX_LOGS_PER_SESSION),
  })
export const createSessionMetadataSchema = (t: TFunction) =>
  z.object({
    startedAt: z.string().min(1, t('weightTracker:validation.startTime')),
    notes: z.string().trim().max(TEXT_MAX),
  })
export type MachineFormValues = z.infer<
  ReturnType<typeof createMachineFormSchema>
>
export type SessionDraftValues = z.infer<
  ReturnType<typeof createSessionDraftSchema>
>
