import type { StrengthPredictionData } from '@metaform/shared-types'
import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/app-error.js'
import type { HistoryParams } from '../weight-tracker/weight-tracker.validation.js'
import { STRENGTH_HISTORY_LIMIT } from './strength-prediction.constants.js'
import { requestStrengthPrediction } from './strength-prediction.client.js'

const sourceWhere = (params: HistoryParams) =>
  params.sourceType === 'exercise'
    ? { exerciseId: params.sourceId, customMachineId: null }
    : { customMachineId: params.sourceId, exerciseId: null }

export const getStrengthPrediction = async (
  userId: string,
  params: HistoryParams,
): Promise<StrengthPredictionData> => {
  const sourceExists =
    params.sourceType === 'exercise'
      ? await prisma.exercise.findUnique({
          where: { id: params.sourceId },
          select: { id: true },
        })
      : await prisma.customMachine.findFirst({
          where: { id: params.sourceId, userId },
          select: { id: true },
        })
  if (!sourceExists) throw new AppError(404, 'Resource not found')

  const rows = await prisma.workoutSession.findMany({
    where: {
      userId,
      completedAt: { not: null },
      exerciseLogs: {
        some: {
          ...sourceWhere(params),
          sets: { some: { isWarmup: false, weightKg: { not: null } } },
        },
      },
    },
    orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
    take: STRENGTH_HISTORY_LIMIT,
    select: {
      completedAt: true,
      exerciseLogs: {
        where: sourceWhere(params),
        select: {
          sets: {
            where: { isWarmup: false, weightKg: { not: null } },
            select: { weightKg: true },
          },
        },
      },
    },
  })
  const sessions = rows.reverse().flatMap((row) => {
    const weights = row.exerciseLogs.flatMap((log) =>
      log.sets.flatMap((set) =>
        set.weightKg === null ? [] : [set.weightKg.toNumber()],
      ),
    )
    if (row.completedAt === null || weights.length === 0) return []
    return [
      {
        completedAt: row.completedAt.toISOString(),
        maxWeightKg: Math.max(...weights),
      },
    ]
  })
  return requestStrengthPrediction(
    params.sourceType === 'exercise' ? 'EXERCISE' : 'CUSTOM_MACHINE',
    sessions,
  )
}
