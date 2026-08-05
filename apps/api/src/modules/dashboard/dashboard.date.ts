import { BODY_WEIGHT_RANGE_DAYS } from './dashboard.constants.js'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export const startOfUtcDay = (date: Date): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )

export const addUtcDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * MILLISECONDS_PER_DAY)

export const startOfUtcWeek = (date: Date): Date => {
  const dayStart = startOfUtcDay(date)
  const daysSinceMonday = (dayStart.getUTCDay() + 6) % 7
  return addUtcDays(dayStart, -daysSinceMonday)
}

export interface DashboardDateRanges {
  todayStart: Date
  currentWeekStart: Date
  nextWeekStart: Date
  previousWeekStart: Date
  bodyWeightStart: Date
}

export const getDashboardDateRanges = (now: Date): DashboardDateRanges => {
  const todayStart = startOfUtcDay(now)
  const currentWeekStart = startOfUtcWeek(now)

  return {
    todayStart,
    currentWeekStart,
    nextWeekStart: addUtcDays(currentWeekStart, 7),
    previousWeekStart: addUtcDays(currentWeekStart, -7),
    bodyWeightStart: addUtcDays(todayStart, -(BODY_WEIGHT_RANGE_DAYS - 1)),
  }
}

export const formatUtcDate = (date: Date): string =>
  date.toISOString().slice(0, 10)
