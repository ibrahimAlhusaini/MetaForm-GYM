import type {
  BodyWeightPoint,
  BodyWeightTrend,
  StrengthProgressItem,
} from '@metaform/shared-types'
import {
  DASHBOARD_DECIMAL_PLACES,
  STABLE_WEIGHT_TOLERANCE_KG,
} from './dashboard.constants.js'
import { formatUtcDate } from './dashboard.date.js'
import type {
  NumericValue,
  StrengthAccumulator,
  StrengthQueryRow,
} from './dashboard.types.js'

const getNumericValue = (value: NumericValue): number => {
  if (typeof value === 'object') {
    return value.toNumber()
  }

  return Number(value)
}

export const roundFiniteNumber = (
  value: number,
  decimalPlaces = DASHBOARD_DECIMAL_PLACES,
): number => {
  if (!Number.isFinite(value)) {
    throw new Error('Dashboard analytics received a non-finite number')
  }

  const scale = 10 ** decimalPlaces
  return Math.round((value + Number.EPSILON) * scale) / scale
}

export const numericToNumber = (
  value: NumericValue,
  decimalPlaces = DASHBOARD_DECIMAL_PLACES,
): number => roundFiniteNumber(getNumericValue(value), decimalPlaces)

export const calculatePercentageChange = (
  current: number,
  previous: number,
): number | null => {
  if (previous === 0) {
    return current === 0 ? 0 : null
  }

  return roundFiniteNumber(((current - previous) / previous) * 100)
}

export const calculateDurationMinutes = (
  startedAt: Date,
  completedAt: Date,
): number => {
  const durationMilliseconds = completedAt.getTime() - startedAt.getTime()
  return Math.max(0, Math.floor(durationMilliseconds / 60_000))
}

export const calculateBodyWeightTrend = (
  points: readonly BodyWeightPoint[],
): BodyWeightTrend => {
  const firstPoint = points[0]
  const lastPoint = points.at(-1)

  if (!firstPoint || !lastPoint || points.length < 2) {
    return {
      direction: 'INSUFFICIENT_DATA',
      changeKg: null,
      percentageChange: null,
    }
  }

  const changeKg = roundFiniteNumber(lastPoint.weightKg - firstPoint.weightKg)
  const direction =
    Math.abs(changeKg) <= STABLE_WEIGHT_TOLERANCE_KG
      ? 'STABLE'
      : changeKg > 0
        ? 'INCREASING'
        : 'DECREASING'

  return {
    direction,
    changeKg,
    percentageChange: calculatePercentageChange(
      lastPoint.weightKg,
      firstPoint.weightKg,
    ),
  }
}

const createStrengthAccumulator = (
  row: StrengthQueryRow,
): StrengthAccumulator => ({
  sourceType: row.sourceType,
  sourceId: row.sourceId,
  name: row.name,
  imageUrl: row.imageUrl,
  targetMuscle: row.targetMuscle,
  personalRecordKg: numericToNumber(row.personalRecordKg),
  totalSessions: numericToNumber(row.totalSessions, 0),
  points: [],
})

export const buildStrengthProgress = (
  rows: readonly StrengthQueryRow[],
): StrengthProgressItem[] => {
  const groupedSources = new Map<string, StrengthAccumulator>()

  for (const row of rows) {
    const key = `${row.sourceType}:${row.sourceId}`
    const source = groupedSources.get(key) ?? createStrengthAccumulator(row)

    source.points.push({
      date: formatUtcDate(row.completedAt),
      weightKg: numericToNumber(row.weightKg),
    })
    groupedSources.set(key, source)
  }

  return [...groupedSources.values()].map((source) => {
    const latestWeightKg = source.points.at(-1)?.weightKg

    if (latestWeightKg === undefined) {
      throw new Error('Strength source is missing its latest point')
    }

    const previousWeightKg = source.points.at(-2)?.weightKg ?? null
    const changeKg =
      previousWeightKg === null
        ? null
        : roundFiniteNumber(latestWeightKg - previousWeightKg)

    return {
      ...source,
      latestWeightKg,
      previousWeightKg,
      changeKg,
      percentageChange:
        previousWeightKg === null
          ? null
          : calculatePercentageChange(latestWeightKg, previousWeightKg),
    }
  })
}
