import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/app-error.js'
import { mapLog } from './session.mapper.js'
import { recalculatePersonalRecords } from './pr.service.js'
import {
  requireOwnedLog,
  requireOwnedSession,
  validateSource,
} from './weight-tracker.ownership.js'
import type {
  CreateLogInput,
  ReorderLogsInput,
  UpdateLogInput,
} from './weight-tracker.validation.js'

const logInclude = {
  exercise: {
    select: { id: true, name: true, primaryMuscle: true, thumbnailUrl: true },
  },
  customMachine: {
    select: { id: true, name: true, targetMuscle: true, imageUrl: true },
  },
  sets: { orderBy: [{ setNumber: 'asc' as const }, { id: 'asc' as const }] },
} satisfies Prisma.ExerciseLogInclude

const conflict = (error: unknown): never => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new AppError(409, 'The requested order position is already in use')
  }
  throw error
}

export const createLog = async (
  userId: string,
  sessionId: string,
  input: CreateLogInput,
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      await requireOwnedSession(tx, userId, sessionId)
      await validateSource(tx, userId, input)
      return mapLog(
        await tx.exerciseLog.create({
          data: {
            workoutSessionId: sessionId,
            exerciseId: input.exerciseId ?? null,
            customMachineId: input.customMachineId ?? null,
            notes: input.notes ?? null,
            orderIndex: input.orderIndex,
          },
          include: logInclude,
        }),
      )
    })
  } catch (error) {
    return conflict(error)
  }
}

export const updateLog = async (
  userId: string,
  logId: string,
  input: UpdateLogInput,
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await requireOwnedLog(tx, userId, logId)
      if (
        input.orderIndex !== undefined &&
        input.orderIndex !== existing.orderIndex
      ) {
        const occupant = await tx.exerciseLog.findUnique({
          where: {
            workoutSessionId_orderIndex: {
              workoutSessionId: existing.workoutSessionId,
              orderIndex: input.orderIndex,
            },
          },
        })
        await tx.exerciseLog.update({
          where: { id: logId },
          data: { orderIndex: -1 },
        })
        if (occupant)
          await tx.exerciseLog.update({
            where: { id: occupant.id },
            data: { orderIndex: existing.orderIndex },
          })
      }
      const data: Prisma.ExerciseLogUncheckedUpdateInput = {}
      if (input.notes !== undefined) data.notes = input.notes
      if (input.orderIndex !== undefined) data.orderIndex = input.orderIndex
      const updated = await tx.exerciseLog.update({
        where: { id: logId },
        data,
        include: logInclude,
      })
      if (
        existing.workoutSession.completedAt &&
        input.orderIndex !== undefined
      ) {
        await recalculatePersonalRecords(tx, userId, [existing])
      }
      return mapLog(updated)
    })
  } catch (error) {
    return conflict(error)
  }
}

export const deleteLog = async (
  userId: string,
  logId: string,
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    const log = await requireOwnedLog(tx, userId, logId)
    await tx.exerciseLog.delete({ where: { id: logId } })
    if (log.workoutSession.completedAt)
      await recalculatePersonalRecords(tx, userId, [log])
  })
}

export const reorderLogs = async (
  userId: string,
  sessionId: string,
  input: ReorderLogsInput,
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    const session = await requireOwnedSession(tx, userId, sessionId)
    const logs = await tx.exerciseLog.findMany({
      where: { workoutSessionId: sessionId },
      select: { id: true },
    })
    const expected = new Set(logs.map((log) => log.id))
    if (
      input.items.length !== logs.length ||
      input.items.some((item) => !expected.has(item.logId))
    ) {
      throw new AppError(
        400,
        'Reorder items must include every log in the session exactly once',
      )
    }
    await Promise.all(
      input.items.map((item, index) =>
        tx.exerciseLog.update({
          where: { id: item.logId },
          data: { orderIndex: -(index + 1) },
        }),
      ),
    )
    await Promise.all(
      input.items.map((item) =>
        tx.exerciseLog.update({
          where: { id: item.logId },
          data: { orderIndex: item.orderIndex },
        }),
      ),
    )
    if (session.completedAt) {
      const sources = await tx.exerciseLog.findMany({
        where: { workoutSessionId: sessionId },
        select: { exerciseId: true, customMachineId: true },
      })
      await recalculatePersonalRecords(tx, userId, sources)
    }
  })
}
