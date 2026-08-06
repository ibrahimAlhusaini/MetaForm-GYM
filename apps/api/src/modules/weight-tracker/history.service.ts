import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/app-error.js'
import type { NumericValue } from '../dashboard/dashboard.types.js'
import { HISTORY_CHART_POINT_LIMIT } from './weight-tracker.constants.js'
import {
  calculateVolume,
  paginationMetadata,
  paginationSkip,
  roundNumber,
} from './weight-tracker.helpers.js'
import type {
  HistoryParams,
  HistoryQuery,
} from './weight-tracker.validation.js'

interface StatsRow {
  personalRecordKg: NumericValue | null
  averageRepresentativeWeightKg: NumericValue | null
  latestRepresentativeWeightKg: NumericValue | null
  previousRepresentativeWeightKg: NumericValue | null
  bestImprovementKg: NumericValue | null
  totalSessions: NumericValue
  totalSets: NumericValue
}

const numeric = (value: NumericValue | null): number | null =>
  value === null ? null : roundNumber(value)

const sourceWhere = (params: HistoryParams) =>
  params.sourceType === 'exercise'
    ? { exerciseId: params.sourceId, customMachineId: null }
    : { customMachineId: params.sourceId, exerciseId: null }

const sourceFilterSql = (
  params: HistoryParams,
  alias: 'exercise_log' | 'el',
) => {
  if (alias === 'el') {
    return params.sourceType === 'exercise'
      ? Prisma.sql`el."exerciseId" = ${params.sourceId}::uuid AND el."customMachineId" IS NULL`
      : Prisma.sql`el."customMachineId" = ${params.sourceId}::uuid AND el."exerciseId" IS NULL`
  }
  return params.sourceType === 'exercise'
    ? Prisma.sql`exercise_log."exerciseId" = ${params.sourceId}::uuid AND exercise_log."customMachineId" IS NULL`
    : Prisma.sql`exercise_log."customMachineId" = ${params.sourceId}::uuid AND exercise_log."exerciseId" IS NULL`
}

const dateFilterSql = (query: HistoryQuery) => Prisma.sql`
  AND (${query.dateFrom ?? null}::timestamptz IS NULL OR workout_session."startedAt" >= ${query.dateFrom ?? null})
  AND (${query.dateTo ?? null}::timestamptz IS NULL OR workout_session."startedAt" <= ${query.dateTo ?? null})`

const queryStats = async (
  userId: string,
  params: HistoryParams,
  query: HistoryQuery,
): Promise<StatsRow> => {
  const rows = await prisma.$queryRaw<StatsRow[]>`
    WITH session_points AS (
      SELECT workout_session.id, workout_session."completedAt", MAX(exercise_set."weightKg") AS representative_weight,
        COUNT(exercise_set.id)::int AS total_sets
      FROM "WorkoutSession" workout_session
      JOIN "ExerciseLog" exercise_log ON exercise_log."workoutSessionId" = workout_session.id
      JOIN "ExerciseSet" exercise_set ON exercise_set."exerciseLogId" = exercise_log.id
      WHERE workout_session."userId" = ${userId}::uuid AND workout_session."completedAt" IS NOT NULL
        AND ${sourceFilterSql(params, 'exercise_log')} ${dateFilterSql(query)}
      GROUP BY workout_session.id, workout_session."completedAt"
      HAVING MAX(exercise_set."weightKg") FILTER (WHERE exercise_set."weightKg" IS NOT NULL AND exercise_set."isWarmup" = false) IS NOT NULL
    ), representatives AS (
      SELECT id, "completedAt",
        (SELECT MAX(es."weightKg") FROM "ExerciseLog" el JOIN "ExerciseSet" es ON es."exerciseLogId" = el.id
          WHERE el."workoutSessionId" = session_points.id AND ${sourceFilterSql(params, 'el')}
            AND es."weightKg" IS NOT NULL AND es."isWarmup" = false) AS weight_kg,
        total_sets
      FROM session_points
    ), changes AS (
      SELECT *, weight_kg - LAG(weight_kg) OVER (ORDER BY "completedAt", id) AS improvement
      FROM representatives
    ), ranked AS (
      SELECT *, ROW_NUMBER() OVER (ORDER BY "completedAt" DESC, id DESC) AS recent_rank FROM changes
    )
    SELECT MAX(weight_kg) AS "personalRecordKg", AVG(weight_kg) AS "averageRepresentativeWeightKg",
      MAX(weight_kg) FILTER (WHERE recent_rank = 1) AS "latestRepresentativeWeightKg",
      MAX(weight_kg) FILTER (WHERE recent_rank = 2) AS "previousRepresentativeWeightKg",
      GREATEST(MAX(improvement), 0) AS "bestImprovementKg", COUNT(*)::int AS "totalSessions",
      COALESCE(SUM(total_sets), 0)::int AS "totalSets" FROM ranked
  `
  return (
    rows[0] ?? {
      personalRecordKg: null,
      averageRepresentativeWeightKg: null,
      latestRepresentativeWeightKg: null,
      previousRepresentativeWeightKg: null,
      bestImprovementKg: null,
      totalSessions: 0,
      totalSets: 0,
    }
  )
}

const mapPoint = (
  session: Awaited<ReturnType<typeof findHistorySessions>>[number],
) => {
  const sets = session.exerciseLogs.flatMap((log) => log.sets)
  const workingWeights = sets
    .filter((set) => !set.isWarmup && set.weightKg !== null)
    .map((set) => Number(set.weightKg?.toString()))
  return {
    workoutSessionId: session.id,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    representativeWeightKg: workingWeights.length
      ? roundNumber(Math.max(...workingWeights))
      : null,
    totalSets: sets.length,
    workingSets: sets.filter((set) => !set.isWarmup).length,
    estimatedVolumeKg: calculateVolume(sets),
    notes: session.notes,
  }
}

const findHistorySessions = (
  userId: string,
  params: HistoryParams,
  query: HistoryQuery,
  skip: number,
  take: number,
) =>
  prisma.workoutSession.findMany({
    where: {
      userId,
      completedAt: { not: null },
      ...(query.dateFrom || query.dateTo
        ? {
            startedAt: {
              ...(query.dateFrom ? { gte: query.dateFrom } : {}),
              ...(query.dateTo ? { lte: query.dateTo } : {}),
            },
          }
        : {}),
      exerciseLogs: {
        some: {
          ...sourceWhere(params),
          sets: { some: { weightKg: { not: null }, isWarmup: false } },
        },
      },
    },
    orderBy: [{ completedAt: query.sortOrder }, { id: query.sortOrder }],
    skip,
    take,
    include: {
      exerciseLogs: {
        where: sourceWhere(params),
        include: {
          sets: {
            orderBy: [{ setNumber: 'asc' as const }, { id: 'asc' as const }],
          },
        },
      },
    },
  })

export const getSourceHistory = async (
  userId: string,
  params: HistoryParams,
  query: HistoryQuery,
) => {
  const source =
    params.sourceType === 'machine'
      ? await prisma.customMachine.findFirst({
          where: { id: params.sourceId, userId },
          select: { id: true, name: true, imageUrl: true, targetMuscle: true },
        })
      : await prisma.exercise.findUnique({
          where: { id: params.sourceId },
          select: {
            id: true,
            name: true,
            thumbnailUrl: true,
            primaryMuscle: true,
          },
        })
  if (!source) throw new AppError(404, 'Resource not found')
  const baseWhere: Prisma.WorkoutSessionWhereInput = {
    userId,
    completedAt: { not: null },
    ...(query.dateFrom || query.dateTo
      ? {
          startedAt: {
            ...(query.dateFrom ? { gte: query.dateFrom } : {}),
            ...(query.dateTo ? { lte: query.dateTo } : {}),
          },
        }
      : {}),
    exerciseLogs: {
      some: {
        ...sourceWhere(params),
        sets: { some: { weightKg: { not: null }, isWarmup: false } },
      },
    },
  }
  const [stats, totalItems, pageRows, chartRows] = await Promise.all([
    queryStats(userId, params, query),
    prisma.workoutSession.count({ where: baseWhere }),
    findHistorySessions(
      userId,
      params,
      query,
      paginationSkip(query),
      query.limit,
    ),
    findHistorySessions(
      userId,
      params,
      { ...query, sortOrder: 'desc' },
      0,
      HISTORY_CHART_POINT_LIMIT,
    ),
  ])
  const sourceData =
    params.sourceType === 'machine'
      ? { type: 'machine', ...source }
      : {
          type: 'exercise',
          id: source.id,
          name: source.name,
          imageUrl: 'thumbnailUrl' in source ? source.thumbnailUrl : null,
          targetMuscle: 'primaryMuscle' in source ? source.primaryMuscle : null,
        }
  return {
    source: sourceData,
    personalRecordKg: numeric(stats.personalRecordKg),
    averageRepresentativeWeightKg: numeric(stats.averageRepresentativeWeightKg),
    latestRepresentativeWeightKg: numeric(stats.latestRepresentativeWeightKg),
    previousRepresentativeWeightKg: numeric(
      stats.previousRepresentativeWeightKg,
    ),
    bestImprovementKg: numeric(stats.bestImprovementKg),
    totalSessions: numeric(stats.totalSessions) ?? 0,
    totalSets: numeric(stats.totalSets) ?? 0,
    chartPoints: chartRows
      .reverse()
      .map(mapPoint)
      .map((point) => ({
        workoutSessionId: point.workoutSessionId,
        completedAt: point.completedAt,
        representativeWeightKg: point.representativeWeightKg,
      })),
    sessions: {
      items: pageRows.map(mapPoint),
      pagination: paginationMetadata(query, totalItems),
    },
  }
}
