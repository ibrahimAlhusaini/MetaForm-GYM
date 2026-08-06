import type { Prisma } from '../../generated/prisma/client.js'
import { sourceKey } from './weight-tracker.helpers.js'
import type { SourceReference } from './weight-tracker.types.js'

type Client = Prisma.TransactionClient

export const uniqueSources = (
  sources: readonly SourceReference[],
): SourceReference[] => {
  const unique = new Map<string, SourceReference>()
  for (const source of sources) {
    unique.set(sourceKey(source), {
      exerciseId: source.exerciseId,
      customMachineId: source.customMachineId,
    })
  }
  return [...unique.values()].filter((source) =>
    Boolean(source.exerciseId ?? source.customMachineId),
  )
}

export const recalculatePersonalRecords = async (
  client: Client,
  userId: string,
  sources: readonly SourceReference[],
): Promise<void> => {
  const distinctSources = uniqueSources(sources)
  if (distinctSources.length === 0) return
  const sourceFilter = { OR: distinctSources }
  await client.exerciseSet.updateMany({
    where: { exerciseLog: { ...sourceFilter, workoutSession: { userId } } },
    data: { isPersonalRecord: false },
  })
  const logs = await client.exerciseLog.findMany({
    where: {
      ...sourceFilter,
      workoutSession: { userId, completedAt: { not: null } },
    },
    orderBy: [
      { workoutSession: { completedAt: 'asc' } },
      { workoutSessionId: 'asc' },
      { orderIndex: 'asc' },
      { id: 'asc' },
    ],
    select: {
      exerciseId: true,
      customMachineId: true,
      sets: {
        where: { weightKg: { not: null }, isWarmup: false },
        orderBy: [{ setNumber: 'asc' }, { id: 'asc' }],
        select: { id: true, weightKg: true },
      },
    },
  })
  const maximumBySource = new Map<string, number>()
  const recordIds: string[] = []
  for (const log of logs) {
    const key = sourceKey(log)
    let maximum = maximumBySource.get(key) ?? -Infinity
    for (const set of log.sets) {
      const weight = Number(set.weightKg?.toString())
      if (weight > maximum) {
        recordIds.push(set.id)
        maximum = weight
      }
    }
    maximumBySource.set(key, maximum)
  }
  if (recordIds.length > 0) {
    await client.exerciseSet.updateMany({
      where: { id: { in: recordIds } },
      data: { isPersonalRecord: true },
    })
  }
}
