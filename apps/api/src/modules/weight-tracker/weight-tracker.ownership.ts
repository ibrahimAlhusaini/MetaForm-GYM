import type { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../utils/app-error.js'
import { RESOURCE_NOT_FOUND_MESSAGE } from './weight-tracker.constants.js'

type Client = Prisma.TransactionClient

const notFound = (): never => {
  throw new AppError(404, RESOURCE_NOT_FOUND_MESSAGE)
}

export const requireOwnedMachine = async (
  client: Client,
  userId: string,
  machineId: string,
) => {
  const machine = await client.customMachine.findFirst({
    where: { id: machineId, userId },
  })
  return machine ?? notFound()
}

export const requireOwnedSession = async (
  client: Client,
  userId: string,
  sessionId: string,
) => {
  const session = await client.workoutSession.findFirst({
    where: { id: sessionId, userId },
  })
  return session ?? notFound()
}

export const requireOwnedLog = async (
  client: Client,
  userId: string,
  logId: string,
) => {
  const log = await client.exerciseLog.findFirst({
    where: { id: logId, workoutSession: { userId } },
    include: { workoutSession: true },
  })
  return log ?? notFound()
}

export const requireOwnedSet = async (
  client: Client,
  userId: string,
  setId: string,
) => {
  const set = await client.exerciseSet.findFirst({
    where: { id: setId, exerciseLog: { workoutSession: { userId } } },
    include: { exerciseLog: { include: { workoutSession: true } } },
  })
  return set ?? notFound()
}

export const validateWorkoutPlan = async (
  client: Client,
  userId: string,
  workoutPlanId: string | null | undefined,
): Promise<void> => {
  if (!workoutPlanId) return
  const plan = await client.workoutPlan.findFirst({
    where: {
      id: workoutPlanId,
      OR: [{ userId }, { isPublic: true }, { userId: null }],
    },
    select: { id: true },
  })
  if (!plan) notFound()
}

export const validateSource = async (
  client: Client,
  userId: string,
  source: {
    exerciseId?: string | null | undefined
    customMachineId?: string | null | undefined
  },
): Promise<void> => {
  if (source.exerciseId) {
    const exercise = await client.exercise.findUnique({
      where: { id: source.exerciseId },
      select: { id: true },
    })
    if (!exercise) notFound()
    return
  }
  if (source.customMachineId) {
    await requireOwnedMachine(client, userId, source.customMachineId)
    return
  }
  notFound()
}

export const validateSources = async (
  client: Client,
  userId: string,
  sources: readonly {
    exerciseId?: string | null | undefined
    customMachineId?: string | null | undefined
  }[],
): Promise<void> => {
  const exerciseIds = [
    ...new Set(
      sources.flatMap((source) =>
        source.exerciseId ? [source.exerciseId] : [],
      ),
    ),
  ]
  const machineIds = [
    ...new Set(
      sources.flatMap((source) =>
        source.customMachineId ? [source.customMachineId] : [],
      ),
    ),
  ]
  const [exerciseCount, machineCount] = await Promise.all([
    client.exercise.count({ where: { id: { in: exerciseIds } } }),
    client.customMachine.count({ where: { id: { in: machineIds }, userId } }),
  ])
  if (
    exerciseCount !== exerciseIds.length ||
    machineCount !== machineIds.length
  )
    notFound()
}
