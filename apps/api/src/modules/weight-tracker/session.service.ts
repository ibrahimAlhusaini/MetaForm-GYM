import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/app-error.js'
import { paginationMetadata, paginationSkip } from './weight-tracker.helpers.js'
import {
  requireOwnedSession,
  validateSources,
  validateWorkoutPlan,
} from './weight-tracker.ownership.js'
import { mapSessionDetail, mapSessionSummary } from './session.mapper.js'
import { recalculatePersonalRecords } from './pr.service.js'
import type { SourceReference } from './weight-tracker.types.js'
import type {
  CompleteSessionInput,
  CreateSessionInput,
  CreateSessionWithEntriesInput,
  ListSessionsQuery,
  UpdateSessionInput,
} from './weight-tracker.validation.js'

const chronology = (startedAt: Date, completedAt: Date | null): void => {
  if (completedAt && completedAt < startedAt)
    throw new AppError(400, 'completedAt must not be earlier than startedAt')
}

const sessionInclude = {
  exerciseLogs: {
    orderBy: [{ orderIndex: 'asc' as const }, { id: 'asc' as const }],
    include: {
      exercise: {
        select: {
          id: true,
          name: true,
          primaryMuscle: true,
          thumbnailUrl: true,
        },
      },
      customMachine: {
        select: { id: true, name: true, targetMuscle: true, imageUrl: true },
      },
      sets: {
        orderBy: [{ setNumber: 'asc' as const }, { id: 'asc' as const }],
      },
    },
  },
} satisfies Prisma.WorkoutSessionInclude

const sourcesForSession = async (
  tx: Prisma.TransactionClient,
  sessionId: string,
): Promise<SourceReference[]> =>
  tx.exerciseLog.findMany({
    where: { workoutSessionId: sessionId },
    select: { exerciseId: true, customMachineId: true },
  })

export const createSession = async (
  userId: string,
  input: CreateSessionInput,
) =>
  prisma.$transaction(async (tx) => {
    await validateWorkoutPlan(tx, userId, input.workoutPlanId)
    const startedAt = input.startedAt ?? new Date()
    const completedAt = input.completedAt ?? null
    chronology(startedAt, completedAt)
    const session = await tx.workoutSession.create({
      data: {
        userId,
        startedAt,
        completedAt,
        notes: input.notes ?? null,
        workoutPlanId: input.workoutPlanId ?? null,
      },
      include: sessionInclude,
    })
    return mapSessionDetail(session)
  })

export const listSessions = async (
  userId: string,
  query: ListSessionsQuery,
) => {
  const where: Prisma.WorkoutSessionWhereInput = {
    userId,
    ...(query.completed === undefined
      ? {}
      : { completedAt: query.completed ? { not: null } : null }),
    ...(query.dateFrom || query.dateTo
      ? {
          startedAt: {
            ...(query.dateFrom ? { gte: query.dateFrom } : {}),
            ...(query.dateTo ? { lte: query.dateTo } : {}),
          },
        }
      : {}),
    ...(query.search
      ? { notes: { contains: query.search, mode: 'insensitive' } }
      : {}),
  }
  const primaryOrder =
    query.sortBy === 'completedAt'
      ? { completedAt: { sort: query.sortOrder, nulls: 'last' as const } }
      : { startedAt: query.sortOrder }
  const orderBy = [
    primaryOrder,
    { id: query.sortOrder },
  ] as Prisma.WorkoutSessionOrderByWithRelationInput[]
  const [sessions, totalItems] = await Promise.all([
    prisma.workoutSession.findMany({
      where,
      orderBy,
      skip: paginationSkip(query),
      take: query.limit,
      include: sessionInclude,
    }),
    prisma.workoutSession.count({ where }),
  ])
  return {
    items: sessions.map(mapSessionSummary),
    pagination: paginationMetadata(query, totalItems),
  }
}

export const getSession = async (userId: string, sessionId: string) => {
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId },
    include: sessionInclude,
  })
  if (!session) throw new AppError(404, 'Resource not found')
  return mapSessionDetail(session)
}

export const updateSession = async (
  userId: string,
  sessionId: string,
  input: UpdateSessionInput,
) =>
  prisma.$transaction(async (tx) => {
    const existing = await requireOwnedSession(tx, userId, sessionId)
    await validateWorkoutPlan(tx, userId, input.workoutPlanId)
    const startedAt = input.startedAt ?? existing.startedAt
    const completedAt =
      input.completedAt === undefined ? existing.completedAt : input.completedAt
    chronology(startedAt, completedAt)
    const sources = await sourcesForSession(tx, sessionId)
    const data: Prisma.WorkoutSessionUncheckedUpdateInput = {}
    if (input.startedAt !== undefined) data.startedAt = input.startedAt
    if (input.completedAt !== undefined) data.completedAt = input.completedAt
    if (input.notes !== undefined) data.notes = input.notes
    if (input.workoutPlanId !== undefined)
      data.workoutPlanId = input.workoutPlanId
    const session = await tx.workoutSession.update({
      where: { id: sessionId },
      data,
      include: sessionInclude,
    })
    if (existing.completedAt || completedAt)
      await recalculatePersonalRecords(tx, userId, sources)
    return mapSessionDetail(session)
  })

export const completeSession = async (
  userId: string,
  sessionId: string,
  input: CompleteSessionInput,
) =>
  prisma.$transaction(async (tx) => {
    const existing = await requireOwnedSession(tx, userId, sessionId)
    if (existing.completedAt && !input.completedAt) {
      const unchanged = await tx.workoutSession.findUniqueOrThrow({
        where: { id: sessionId },
        include: sessionInclude,
      })
      return mapSessionDetail(unchanged)
    }
    const completedAt = input.completedAt ?? new Date()
    chronology(existing.startedAt, completedAt)
    const session = await tx.workoutSession.update({
      where: { id: sessionId },
      data: { completedAt },
      include: sessionInclude,
    })
    await recalculatePersonalRecords(
      tx,
      userId,
      await sourcesForSession(tx, sessionId),
    )
    return mapSessionDetail(session)
  })

export const deleteSession = async (
  userId: string,
  sessionId: string,
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    const existing = await requireOwnedSession(tx, userId, sessionId)
    const sources = await sourcesForSession(tx, sessionId)
    await tx.workoutSession.delete({ where: { id: sessionId } })
    if (existing.completedAt)
      await recalculatePersonalRecords(tx, userId, sources)
  })
}

export const createSessionWithEntries = async (
  userId: string,
  input: CreateSessionWithEntriesInput,
) =>
  prisma.$transaction(async (tx) => {
    await validateWorkoutPlan(tx, userId, input.workoutPlanId)
    await validateSources(tx, userId, input.entries)
    const startedAt = input.startedAt ?? new Date()
    const completedAt = input.completedAt ?? null
    chronology(startedAt, completedAt)
    const session = await tx.workoutSession.create({
      data: {
        userId,
        startedAt,
        completedAt,
        notes: input.notes ?? null,
        workoutPlanId: input.workoutPlanId ?? null,
        exerciseLogs: {
          create: input.entries.map((entry) => ({
            exerciseId: entry.exerciseId ?? null,
            customMachineId: entry.customMachineId ?? null,
            notes: entry.notes ?? null,
            orderIndex: entry.orderIndex,
            sets: {
              create: entry.sets.map((set) => ({
                setNumber: set.setNumber,
                weightKg: set.weightKg ?? null,
                reps: set.reps ?? null,
                durationSeconds: set.durationSeconds ?? null,
                distanceMeters: set.distanceMeters ?? null,
                isWarmup: set.isWarmup,
                isPersonalRecord: false,
              })),
            },
          })),
        },
      },
      include: sessionInclude,
    })
    const sources = input.entries.map((entry) => ({
      exerciseId: entry.exerciseId ?? null,
      customMachineId: entry.customMachineId ?? null,
    }))
    if (completedAt) await recalculatePersonalRecords(tx, userId, sources)
    const refreshed = completedAt
      ? await tx.workoutSession.findUniqueOrThrow({
          where: { id: session.id },
          include: sessionInclude,
        })
      : session
    return mapSessionDetail(refreshed)
  })
