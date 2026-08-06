import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/app-error.js'
import { mapSet } from './session.mapper.js'
import { recalculatePersonalRecords } from './pr.service.js'
import { requireOwnedLog, requireOwnedSet } from './weight-tracker.ownership.js'
import type {
  CreateSetInput,
  ReorderSetsInput,
  UpdateSetInput,
} from './weight-tracker.validation.js'

const conflict = (error: unknown): never => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
    throw new AppError(409, 'The requested set number is already in use')
  throw error
}

export const createSet = async (
  userId: string,
  logId: string,
  input: CreateSetInput,
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const log = await requireOwnedLog(tx, userId, logId)
      const set = await tx.exerciseSet.create({
        data: {
          exerciseLogId: logId,
          setNumber: input.setNumber,
          weightKg: input.weightKg ?? null,
          reps: input.reps ?? null,
          durationSeconds: input.durationSeconds ?? null,
          distanceMeters: input.distanceMeters ?? null,
          isWarmup: input.isWarmup,
          isPersonalRecord: false,
        },
      })
      if (log.workoutSession.completedAt)
        await recalculatePersonalRecords(tx, userId, [log])
      const refreshed = await tx.exerciseSet.findUniqueOrThrow({
        where: { id: set.id },
      })
      return mapSet(refreshed)
    })
  } catch (error) {
    return conflict(error)
  }
}

export const updateSet = async (
  userId: string,
  setId: string,
  input: UpdateSetInput,
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await requireOwnedSet(tx, userId, setId)
      const metrics = [
        input.weightKg === undefined ? existing.weightKg : input.weightKg,
        input.reps === undefined ? existing.reps : input.reps,
        input.durationSeconds === undefined
          ? existing.durationSeconds
          : input.durationSeconds,
        input.distanceMeters === undefined
          ? existing.distanceMeters
          : input.distanceMeters,
      ]
      if (metrics.every((metric) => metric === null))
        throw new AppError(400, 'At least one performance metric is required')
      if (
        input.setNumber !== undefined &&
        input.setNumber !== existing.setNumber
      ) {
        const occupant = await tx.exerciseSet.findUnique({
          where: {
            exerciseLogId_setNumber: {
              exerciseLogId: existing.exerciseLogId,
              setNumber: input.setNumber,
            },
          },
        })
        await tx.exerciseSet.update({
          where: { id: setId },
          data: { setNumber: -1 },
        })
        if (occupant)
          await tx.exerciseSet.update({
            where: { id: occupant.id },
            data: { setNumber: existing.setNumber },
          })
      }
      const data: Prisma.ExerciseSetUncheckedUpdateInput = {
        isPersonalRecord: false,
      }
      if (input.setNumber !== undefined) data.setNumber = input.setNumber
      if (input.weightKg !== undefined) data.weightKg = input.weightKg
      if (input.reps !== undefined) data.reps = input.reps
      if (input.durationSeconds !== undefined)
        data.durationSeconds = input.durationSeconds
      if (input.distanceMeters !== undefined)
        data.distanceMeters = input.distanceMeters
      if (input.isWarmup !== undefined) data.isWarmup = input.isWarmup
      await tx.exerciseSet.update({ where: { id: setId }, data })
      if (existing.exerciseLog.workoutSession.completedAt)
        await recalculatePersonalRecords(tx, userId, [existing.exerciseLog])
      return mapSet(
        await tx.exerciseSet.findUniqueOrThrow({ where: { id: setId } }),
      )
    })
  } catch (error) {
    return conflict(error)
  }
}

export const deleteSet = async (
  userId: string,
  setId: string,
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    const existing = await requireOwnedSet(tx, userId, setId)
    await tx.exerciseSet.delete({ where: { id: setId } })
    if (existing.exerciseLog.workoutSession.completedAt)
      await recalculatePersonalRecords(tx, userId, [existing.exerciseLog])
  })
}

export const reorderSets = async (
  userId: string,
  logId: string,
  input: ReorderSetsInput,
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    const log = await requireOwnedLog(tx, userId, logId)
    const sets = await tx.exerciseSet.findMany({
      where: { exerciseLogId: logId },
      select: { id: true },
    })
    const expected = new Set(sets.map((set) => set.id))
    if (
      input.items.length !== sets.length ||
      input.items.some((item) => !expected.has(item.setId))
    )
      throw new AppError(
        400,
        'Reorder items must include every set in the log exactly once',
      )
    await Promise.all(
      input.items.map((item, index) =>
        tx.exerciseSet.update({
          where: { id: item.setId },
          data: { setNumber: -(index + 1) },
        }),
      ),
    )
    await Promise.all(
      input.items.map((item) =>
        tx.exerciseSet.update({
          where: { id: item.setId },
          data: { setNumber: item.setNumber },
        }),
      ),
    )
    if (log.workoutSession.completedAt)
      await recalculatePersonalRecords(tx, userId, [log])
  })
}
