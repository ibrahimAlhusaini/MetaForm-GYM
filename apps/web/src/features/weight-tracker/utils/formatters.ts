import { muscleLabels } from '../constants/weight-tracker.constants.js'
import type { MuscleGroup, SourceType } from '../types/weight-tracker.types.js'

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
})
export const formatKg = (value: number | null): string =>
  value === null ? 'Not available' : `${numberFormatter.format(value)} kg`
export const formatVolume = (value: number): string =>
  `${numberFormatter.format(value)} kg`
export const formatDuration = (minutes: number | null): string =>
  minutes === null ? 'In progress' : `${String(minutes)} min`
export const formatDate = (value: string): string =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(value),
  )
export const formatDateTime = (value: string | null): string =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : 'Not completed'
export const formatMuscle = (value: MuscleGroup | null | undefined): string =>
  value ? muscleLabels[value] : 'Not specified'
export const formatSourceType = (value: SourceType): string =>
  value === 'machine' ? 'Custom machine' : 'Exercise'
export const sessionStatus = (completedAt: string | null): string =>
  completedAt ? 'Completed' : 'In progress'
export const paginationLabel = (page: number, totalPages: number): string =>
  totalPages === 0
    ? 'No pages'
    : `Page ${String(page)} of ${String(totalPages)}`

export const toDateTimeLocal = (iso?: string): string => {
  const date = iso ? new Date(iso) : new Date()
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
