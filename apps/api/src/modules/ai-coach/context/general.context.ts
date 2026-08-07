import { prisma } from '../../../config/prisma.js'
import {
  calculateBodyWeightTrend,
  calculateDurationMinutes,
  calculatePercentageChange,
  numericToNumber,
} from '../../dashboard/dashboard.analytics.js'
import {
  addUtcDays,
  formatUtcDate,
  getDashboardDateRanges,
} from '../../dashboard/dashboard.date.js'
import { getDashboardSummary } from '../../dashboard/dashboard.service.js'
import { getLatestNutrition } from '../../nutrition/nutrition.service.js'
import { getProfileSummary } from '../../profile/profile.service.js'
import { AI_DATA_WINDOW_DAYS } from '../ai-coach.constants.js'

const latestNutritionContext = async (userId: string) => {
  const latest = await getLatestNutrition(userId)
  return latest
    ? {
        calculatedAt: latest.calculatedAt,
        goal: latest.inputs?.goal ?? null,
        weightKg: latest.inputs?.weightKg ?? null,
        maintenanceCalories: latest.results.maintenanceCalories,
        recommendedCalories: latest.results.recommendedCalories,
        proteinGrams: latest.results.proteinGrams,
        carbohydrateGrams: latest.results.carbohydrateGrams,
        fatGrams: latest.results.fatGrams,
        waterLiters: latest.results.waterLiters,
      }
    : null
}
export const buildProgressContext = async (
  userId: string,
  now = new Date(),
) => {
  const [dashboard, profile, nutrition] = await Promise.all([
    getDashboardSummary(userId, now),
    getProfileSummary(userId, now),
    latestNutritionContext(userId),
  ])
  return {
    fitnessGoal: profile.fitnessGoal,
    workoutSummary: {
      completed: dashboard.overview.workoutsCompleted,
      currentStreak: dashboard.overview.currentWorkoutStreak,
      weekly: dashboard.overview.weeklyProgress,
    },
    bodyWeight: dashboard.bodyWeightProgress,
    strength: dashboard.strengthProgress.machines.map((item) => ({
      name: item.name,
      targetMuscle: item.targetMuscle,
      latestWeightKg: item.latestWeightKg,
      previousWeightKg: item.previousWeightKg,
      percentageChange: item.percentageChange,
    })),
    nutrition,
    insufficientData:
      dashboard.overview.workoutsCompleted === 0 &&
      dashboard.bodyWeightProgress.points.length === 0 &&
      dashboard.strengthProgress.machines.length === 0 &&
      !nutrition,
  }
}
export const buildNutritionContext = async (
  userId: string,
  now = new Date(),
) => {
  const rangeStart = addUtcDays(now, -(AI_DATA_WINDOW_DAYS - 1))
  const [latest, measurements, profile] = await Promise.all([
    latestNutritionContext(userId),
    prisma.bodyMeasurement.findMany({
      where: { userId, measuredAt: { gte: rangeStart, lte: now } },
      orderBy: [{ measuredAt: 'asc' }, { id: 'asc' }],
      select: { measuredAt: true, weightKg: true },
    }),
    getProfileSummary(userId, now),
  ])
  const points = measurements.map((item) => ({
    date: formatUtcDate(item.measuredAt),
    weightKg: numericToNumber(item.weightKg),
  }))
  return {
    fitnessGoal: profile.fitnessGoal,
    latestNutrition: latest,
    bodyWeightTrend: calculateBodyWeightTrend(points),
    insufficientData: !latest,
  }
}
export const buildWeeklyContext = async (userId: string, now = new Date()) => {
  const ranges = getDashboardDateRanges(now)
  const select = {
    startedAt: true,
    completedAt: true,
    exerciseLogs: {
      select: {
        sets: { where: { isPersonalRecord: true }, select: { id: true } },
      },
    },
  } as const
  const [current, previous, nutrition, weights] = await Promise.all([
    prisma.workoutSession.findMany({
      where: {
        userId,
        completedAt: { gte: ranges.currentWeekStart, lt: ranges.nextWeekStart },
      },
      select,
    }),
    prisma.workoutSession.findMany({
      where: {
        userId,
        completedAt: {
          gte: ranges.previousWeekStart,
          lt: ranges.currentWeekStart,
        },
      },
      select,
    }),
    latestNutritionContext(userId),
    prisma.bodyMeasurement.findMany({
      where: {
        userId,
        measuredAt: { gte: ranges.currentWeekStart, lt: ranges.nextWeekStart },
      },
      orderBy: [{ measuredAt: 'asc' }, { id: 'asc' }],
      select: { measuredAt: true, weightKg: true },
    }),
  ])
  const minutes = current.reduce(
    (total, session) =>
      total +
      (session.completedAt
        ? calculateDurationMinutes(session.startedAt, session.completedAt)
        : 0),
    0,
  )
  const weightPoints = weights.map((item) => ({
    date: formatUtcDate(item.measuredAt),
    weightKg: numericToNumber(item.weightKg),
  }))
  return {
    period: {
      from: ranges.currentWeekStart.toISOString(),
      to: ranges.nextWeekStart.toISOString(),
    },
    workouts: {
      completed: current.length,
      previousWeekCompleted: previous.length,
      percentageChange: calculatePercentageChange(
        current.length,
        previous.length,
      ),
      activeDays: new Set(
        current.map((item) =>
          formatUtcDate(item.completedAt ?? item.startedAt),
        ),
      ).size,
      durationMinutes: minutes,
      personalRecords: current
        .flatMap((item) => item.exerciseLogs)
        .flatMap((log) => log.sets).length,
    },
    bodyWeightTrend: calculateBodyWeightTrend(weightPoints),
    latestNutrition: nutrition,
    insufficientData:
      current.length === 0 && weights.length === 0 && !nutrition,
  }
}
