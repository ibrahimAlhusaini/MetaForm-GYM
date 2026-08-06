import type {
  BodyWeightTrendDirection,
  DashboardMuscleGroup,
  StrengthSourceType,
} from '@metaform/shared-types'

const decimalFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
})

const wholeNumberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
})

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const chartDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
})

const parseDate = (value: string): Date | null => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const formatWeight = (value: number): string =>
  `${decimalFormatter.format(value)} kg`

export const formatCalories = (value: number): string =>
  `${wholeNumberFormatter.format(value)} kcal`

export const formatDuration = (minutes: number): string =>
  `${wholeNumberFormatter.format(minutes)} min`

export const formatCount = (
  value: number,
  pluralUnit: string,
  descriptor?: string,
): string => {
  const unit = value === 1 ? pluralUnit.replace(/s$/, '') : pluralUnit
  const qualifier = descriptor ? `${descriptor} ` : ''
  return `${wholeNumberFormatter.format(value)} ${qualifier}${unit}`
}

export const formatSignedWeight = (value: number): string => {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${decimalFormatter.format(value)} kg`
}

export const formatSignedPercentage = (value: number): string => {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${decimalFormatter.format(value)}%`
}

export const formatDateTime = (value: string): string => {
  const date = parseDate(value)
  return date ? dateTimeFormatter.format(date) : 'Update time unavailable'
}

export const formatChartDate = (value: string): string => {
  const date = parseDate(`${value}T00:00:00.000Z`)
  return date ? chartDateFormatter.format(date) : value
}

const trendLabels: Record<BodyWeightTrendDirection, string> = {
  INCREASING: 'Increasing',
  DECREASING: 'Decreasing',
  STABLE: 'Stable',
  INSUFFICIENT_DATA: 'Insufficient data',
}

export const formatTrendDirection = (
  direction: BodyWeightTrendDirection,
): string => trendLabels[direction]

export const formatMuscleGroup = (muscle: DashboardMuscleGroup): string =>
  muscle
    .toLowerCase()
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')

export const formatSourceType = (sourceType: StrengthSourceType): string =>
  sourceType === 'EXERCISE' ? 'Exercise' : 'Custom machine'
