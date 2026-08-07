import type { SourceReference, SourceType } from './weight-tracker.types.js'
export { paginationMetadata, paginationSkip } from '../../utils/pagination.js'

type Numeric = number | string | { toString(): string }

export const roundNumber = (value: Numeric, places = 2): number => {
  const numeric = typeof value === 'number' ? value : Number(value.toString())
  if (!Number.isFinite(numeric)) throw new Error('Non-finite numeric value')
  const scale = 10 ** places
  return Math.round((numeric + Number.EPSILON) * scale) / scale
}

export const optionalNumber = (value: Numeric | null): number | null =>
  value === null ? null : roundNumber(value)

export const sourceKey = (source: SourceReference): string =>
  source.exerciseId
    ? `exercise:${source.exerciseId}`
    : `machine:${source.customMachineId ?? ''}`

export const sourceReference = (
  sourceType: SourceType,
  sourceId: string,
): SourceReference => ({
  exerciseId: sourceType === 'exercise' ? sourceId : null,
  customMachineId: sourceType === 'machine' ? sourceId : null,
})

export const calculateDurationMinutes = (
  startedAt: Date,
  completedAt: Date | null,
): number | null =>
  completedAt
    ? Math.max(
        0,
        Math.floor((completedAt.getTime() - startedAt.getTime()) / 60_000),
      )
    : null

export const calculateVolume = (
  sets: readonly {
    weightKg: Numeric | null
    reps: number | null
    isWarmup: boolean
  }[],
): number =>
  roundNumber(
    sets.reduce((sum, set) => {
      if (set.isWarmup || set.weightKg === null || set.reps === null) return sum
      return sum + roundNumber(set.weightKg) * set.reps
    }, 0),
  )
