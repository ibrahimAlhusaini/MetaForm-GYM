import type {
  BulkSessionInput,
  MachineInput,
  SessionDraft,
  SetDraft,
  SetInput,
} from '../types/weight-tracker.types.js'
import type { MachineFormValues } from '../validation/weight-tracker.schemas.js'

const nullableNumber = (value: string): number | null =>
  value.trim() === '' ? null : Number(value)
const nullableText = (value: string): string | null =>
  value.trim() === '' ? null : value.trim()

export const machinePayload = (values: MachineFormValues): MachineInput => ({
  name: values.name.trim(),
  imageUrl: nullableText(values.imageUrl),
  targetMuscle: values.targetMuscle,
  description: nullableText(values.description),
})

export const setPayload = (set: SetDraft, setNumber: number): SetInput => ({
  setNumber,
  weightKg: nullableNumber(set.weightKg),
  reps: nullableNumber(set.reps),
  durationSeconds: nullableNumber(set.durationSeconds),
  distanceMeters: nullableNumber(set.distanceMeters),
  isWarmup: set.isWarmup,
})

export const sessionPayload = (draft: SessionDraft): BulkSessionInput => ({
  startedAt: new Date(draft.startedAt).toISOString(),
  completedAt: draft.completeImmediately ? new Date().toISOString() : null,
  notes: nullableText(draft.notes),
  workoutPlanId: draft.workoutPlanId ?? null,
  entries: draft.entries.map((entry, orderIndex) => ({
    exerciseId: entry.sourceType === 'exercise' ? entry.exerciseId : null,
    customMachineId:
      entry.sourceType === 'machine' ? entry.customMachineId : null,
    notes: nullableText(entry.notes),
    orderIndex,
    sets: entry.sets.map((set, index) => setPayload(set, index + 1)),
  })),
})

export const emptySetDraft = (setNumber = 1): SetDraft => ({
  setNumber,
  weightKg: '',
  reps: '',
  durationSeconds: '',
  distanceMeters: '',
  isWarmup: false,
})
