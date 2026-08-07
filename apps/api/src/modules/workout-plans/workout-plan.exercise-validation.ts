import type { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../utils/app-error.js'

type Client = Prisma.TransactionClient

export const validatePublishedExerciseIds = async (
  client: Client,
  exerciseIds: readonly string[],
): Promise<void> => {
  const uniqueIds = [...new Set(exerciseIds)]
  if (uniqueIds.length === 0) return
  const count = await client.exercise.count({
    where: { id: { in: uniqueIds }, isPublished: true },
  })
  if (count !== uniqueIds.length)
    throw new AppError(404, 'One or more exercises were not found')
}
