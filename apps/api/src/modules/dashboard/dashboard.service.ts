import type {
  BodyWeightPoint,
  DashboardSummaryData,
  StrengthProgressItem,
} from '@metaform/shared-types'
import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/app-error.js'
import {
  buildStrengthProgress,
  calculateBodyWeightTrend,
  calculateDurationMinutes,
  calculatePercentageChange,
  numericToNumber,
} from './dashboard.analytics.js'
import {
  addUtcDays,
  formatUtcDate,
  getDashboardDateRanges,
} from './dashboard.date.js'
import {
  queryCurrentWorkoutStreak,
  queryStrengthProgress,
} from './dashboard.queries.js'

const getFirstName = (fullName: string | null): string =>
  fullName?.split(/\s+/).find((part) => part.length > 0) ?? 'Member'

export const getDashboardSummary = async (
  userId: string,
  now = new Date(),
): Promise<DashboardSummaryData> => {
  const ranges = getDashboardDateRanges(now)
  const tomorrowStart = addUtcDays(ranges.todayStart, 1)

  const [
    user,
    latestMeasurement,
    bodyMeasurements,
    latestNutrition,
    workoutsCompleted,
    lastWorkout,
    currentWeekCompleted,
    previousWeekCompleted,
    currentWorkoutStreak,
    strengthRows,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        profile: { select: { fullName: true, currentWeightKg: true } },
      },
    }),
    prisma.bodyMeasurement.findFirst({
      where: { userId },
      orderBy: [{ measuredAt: 'desc' }, { id: 'desc' }],
      select: { weightKg: true },
    }),
    prisma.bodyMeasurement.findMany({
      where: {
        userId,
        measuredAt: { gte: ranges.bodyWeightStart, lt: tomorrowStart },
      },
      orderBy: [{ measuredAt: 'asc' }, { id: 'asc' }],
      select: { measuredAt: true, weightKg: true },
    }),
    prisma.nutritionCalculation.findFirst({
      where: { userId },
      orderBy: [{ calculatedAt: 'desc' }, { id: 'desc' }],
      select: { maintenanceCalories: true },
    }),
    prisma.workoutSession.count({
      where: { userId, completedAt: { not: null } },
    }),
    prisma.workoutSession.findFirst({
      where: { userId, completedAt: { not: null } },
      orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
      select: { id: true, startedAt: true, completedAt: true },
    }),
    prisma.workoutSession.count({
      where: {
        userId,
        completedAt: {
          gte: ranges.currentWeekStart,
          lt: ranges.nextWeekStart,
        },
      },
    }),
    prisma.workoutSession.count({
      where: {
        userId,
        completedAt: {
          gte: ranges.previousWeekStart,
          lt: ranges.currentWeekStart,
        },
      },
    }),
    queryCurrentWorkoutStreak(userId, formatUtcDate(ranges.todayStart)),
    queryStrengthProgress(userId),
  ])

  if (!user) {
    throw new AppError(401, 'Authentication required')
  }

  const bodyWeightPoints: BodyWeightPoint[] = bodyMeasurements.map(
    (measurement) => ({
      date: formatUtcDate(measurement.measuredAt),
      weightKg: numericToNumber(measurement.weightKg),
    }),
  )
  const strengthMachines: StrengthProgressItem[] =
    buildStrengthProgress(strengthRows)
  const completedAt = lastWorkout?.completedAt

  return {
    user: { firstName: getFirstName(user.profile?.fullName ?? null) },
    overview: {
      currentBodyWeightKg: latestMeasurement
        ? numericToNumber(latestMeasurement.weightKg)
        : user.profile?.currentWeightKg
          ? numericToNumber(user.profile.currentWeightKg)
          : null,
      dailyCalories: latestNutrition?.maintenanceCalories ?? null,
      currentWorkoutStreak: numericToNumber(currentWorkoutStreak, 0),
      workoutsCompleted,
      lastWorkout:
        lastWorkout && completedAt
          ? {
              id: lastWorkout.id,
              startedAt: lastWorkout.startedAt.toISOString(),
              completedAt: completedAt.toISOString(),
              durationMinutes: calculateDurationMinutes(
                lastWorkout.startedAt,
                completedAt,
              ),
            }
          : null,
      weeklyProgress: {
        completedWorkouts: currentWeekCompleted,
        previousWeekCompletedWorkouts: previousWeekCompleted,
        percentageChange: calculatePercentageChange(
          currentWeekCompleted,
          previousWeekCompleted,
        ),
      },
    },
    bodyWeightProgress: {
      points: bodyWeightPoints,
      trend: calculateBodyWeightTrend(bodyWeightPoints),
    },
    strengthProgress: { machines: strengthMachines },
    meta: {
      generatedAt: now.toISOString(),
      bodyWeightDataAvailable: bodyWeightPoints.length > 0,
      strengthDataAvailable: strengthMachines.length > 0,
    },
  }
}
