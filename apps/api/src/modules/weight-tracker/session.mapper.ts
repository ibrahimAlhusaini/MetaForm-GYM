import {
  calculateDurationMinutes,
  calculateVolume,
  optionalNumber,
} from './weight-tracker.helpers.js'

interface SetRow {
  id: string
  setNumber: number
  weightKg: { toString(): string } | null
  reps: number | null
  durationSeconds: number | null
  distanceMeters: { toString(): string } | null
  isWarmup: boolean
  isPersonalRecord: boolean
  createdAt: Date
  updatedAt: Date
}
interface LogRow {
  id: string
  exerciseId: string | null
  customMachineId: string | null
  notes: string | null
  orderIndex: number
  createdAt: Date
  updatedAt: Date
  sets: SetRow[]
  exercise?: {
    id: string
    name: string
    primaryMuscle: string
    thumbnailUrl: string | null
  } | null
  customMachine?: {
    id: string
    name: string
    targetMuscle: string
    imageUrl: string | null
  } | null
}
interface SessionRow {
  id: string
  workoutPlanId: string | null
  startedAt: Date
  completedAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  exerciseLogs: LogRow[]
}

const mapSource = (log: LogRow) => {
  if (log.exercise) return { type: 'exercise' as const, ...log.exercise }
  if (log.customMachine)
    return { type: 'machine' as const, ...log.customMachine }
  throw new Error('Exercise log is missing its source')
}

export const mapSet = (set: SetRow) => ({
  ...set,
  weightKg: optionalNumber(set.weightKg),
  distanceMeters: optionalNumber(set.distanceMeters),
  createdAt: set.createdAt.toISOString(),
  updatedAt: set.updatedAt.toISOString(),
})

export const mapLog = (log: LogRow) => ({
  id: log.id,
  exerciseId: log.exerciseId,
  customMachineId: log.customMachineId,
  notes: log.notes,
  orderIndex: log.orderIndex,
  source: mapSource(log),
  sets: log.sets.map(mapSet),
  createdAt: log.createdAt.toISOString(),
  updatedAt: log.updatedAt.toISOString(),
})

export const mapSessionSummary = (session: SessionRow) => {
  const sets = session.exerciseLogs.flatMap((log) => log.sets)
  return {
    id: session.id,
    workoutPlanId: session.workoutPlanId,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    durationMinutes: calculateDurationMinutes(
      session.startedAt,
      session.completedAt,
    ),
    notes: session.notes,
    exerciseLogCount: session.exerciseLogs.length,
    totalSetCount: sets.length,
    totalVolumeKg: calculateVolume(sets),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  }
}

export const mapSessionDetail = (session: SessionRow) => ({
  ...mapSessionSummary(session),
  exerciseLogs: session.exerciseLogs.map(mapLog),
})
