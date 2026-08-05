import type {
  DashboardMuscleGroup,
  StrengthPoint,
  StrengthSourceType,
} from '@metaform/shared-types'

export type NumericValue = bigint | number | string | { toNumber: () => number }

export interface StrengthQueryRow {
  sourceType: StrengthSourceType
  sourceId: string
  name: string
  imageUrl: string | null
  targetMuscle: DashboardMuscleGroup
  personalRecordKg: NumericValue
  totalSessions: NumericValue
  completedAt: Date
  weightKg: NumericValue
}

export interface StrengthAccumulator {
  sourceType: StrengthSourceType
  sourceId: string
  name: string
  imageUrl: string | null
  targetMuscle: DashboardMuscleGroup
  personalRecordKg: number
  totalSessions: number
  points: StrengthPoint[]
}
