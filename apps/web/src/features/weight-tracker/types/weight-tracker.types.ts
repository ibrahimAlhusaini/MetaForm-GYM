import type { muscleGroups } from '../constants/weight-tracker.constants.js'

export type MuscleGroup = (typeof muscleGroups)[number]
export type SourceType = 'exercise' | 'machine'
export type SortOrder = 'asc' | 'desc'

export interface Pagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface Machine {
  id: string
  name: string
  imageUrl: string | null
  targetMuscle: MuscleGroup
  description: string | null
  createdAt: string
  updatedAt: string
}
export interface MachineInput {
  name: string
  imageUrl: string | null
  targetMuscle: MuscleGroup
  description: string | null
}
export interface MachineQuery {
  page?: number
  limit?: number
  search?: string
  targetMuscle?: MuscleGroup
  sortBy?: 'createdAt' | 'updatedAt' | 'name'
  sortOrder?: SortOrder
}

export interface ExerciseSource {
  type: 'exercise'
  id: string
  name: string
  primaryMuscle: MuscleGroup
  thumbnailUrl: string | null
}
export interface MachineSource {
  type: 'machine'
  id: string
  name: string
  targetMuscle: MuscleGroup
  imageUrl: string | null
}
export type WorkoutSource = ExerciseSource | MachineSource

export interface ExerciseSet {
  id: string
  setNumber: number
  weightKg: number | null
  reps: number | null
  durationSeconds: number | null
  distanceMeters: number | null
  isWarmup: boolean
  isPersonalRecord: boolean
  createdAt: string
  updatedAt: string
}
export interface SetInput {
  setNumber: number
  weightKg: number | null
  reps: number | null
  durationSeconds: number | null
  distanceMeters: number | null
  isWarmup: boolean
}
export interface ExerciseLog {
  id: string
  exerciseId: string | null
  customMachineId: string | null
  notes: string | null
  orderIndex: number
  source: WorkoutSource
  sets: ExerciseSet[]
  createdAt: string
  updatedAt: string
}
export interface SessionSummary {
  id: string
  workoutPlanId: string | null
  startedAt: string
  completedAt: string | null
  durationMinutes: number | null
  notes: string | null
  exerciseLogCount: number
  totalSetCount: number
  totalVolumeKg: number
  createdAt: string
  updatedAt: string
}
export interface SessionDetail extends SessionSummary {
  exerciseLogs: ExerciseLog[]
}
export interface SessionQuery {
  page?: number
  limit?: number
  completed?: boolean
  dateFrom?: string
  dateTo?: string
  search?: string
  sortBy?: 'startedAt' | 'completedAt'
  sortOrder?: SortOrder
}
export interface SessionMetadataInput {
  startedAt?: string
  completedAt?: string | null
  notes?: string | null
  workoutPlanId?: string | null
}
export interface LogInput {
  exerciseId: string | null
  customMachineId: string | null
  notes: string | null
  orderIndex: number
}

export interface BulkEntryInput extends LogInput {
  sets: SetInput[]
}
export interface BulkSessionInput extends SessionMetadataInput {
  entries: BulkEntryInput[]
}

export interface HistorySession {
  workoutSessionId: string
  startedAt: string
  completedAt: string | null
  representativeWeightKg: number | null
  totalSets: number
  workingSets: number
  estimatedVolumeKg: number
  notes: string | null
}
export interface HistoryPoint {
  workoutSessionId: string
  completedAt: string | null
  representativeWeightKg: number | null
}
export interface SourceHistory {
  source: {
    type: SourceType
    id: string
    name: string
    imageUrl?: string | null
    targetMuscle?: MuscleGroup | null
  }
  personalRecordKg: number | null
  averageRepresentativeWeightKg: number | null
  latestRepresentativeWeightKg: number | null
  previousRepresentativeWeightKg: number | null
  bestImprovementKg: number | null
  totalSessions: number
  totalSets: number
  chartPoints: HistoryPoint[]
  sessions: { items: HistorySession[]; pagination: Pagination }
}

export interface PaginatedMachines {
  items: Machine[]
  pagination: Pagination
}
export interface PaginatedSessions {
  items: SessionSummary[]
  pagination: Pagination
}
export interface ApiResponse<T> {
  success: true
  data: T
}

export interface SetDraft {
  setNumber: number
  weightKg: string
  reps: string
  durationSeconds: string
  distanceMeters: string
  isWarmup: boolean
}
export interface EntryDraft {
  customMachineId: string
  notes: string
  sets: SetDraft[]
}
export interface SessionDraft {
  startedAt: string
  notes: string
  completeImmediately: boolean
  entries: EntryDraft[]
}
