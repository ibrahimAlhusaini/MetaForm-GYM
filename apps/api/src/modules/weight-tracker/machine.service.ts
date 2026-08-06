import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/app-error.js'
import { paginationMetadata, paginationSkip } from './weight-tracker.helpers.js'
import { requireOwnedMachine } from './weight-tracker.ownership.js'
import type {
  CreateMachineInput,
  ListMachinesQuery,
  UpdateMachineInput,
} from './weight-tracker.validation.js'

const mapMachine = (machine: {
  id: string
  name: string
  imageUrl: string | null
  targetMuscle: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}) => ({
  ...machine,
  createdAt: machine.createdAt.toISOString(),
  updatedAt: machine.updatedAt.toISOString(),
})

const handleUniqueName = (error: unknown): never => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new AppError(409, 'A machine with this name already exists')
  }
  throw error
}

export const createMachine = async (
  userId: string,
  input: CreateMachineInput,
) => {
  try {
    return mapMachine(
      await prisma.customMachine.create({
        data: {
          userId,
          name: input.name,
          targetMuscle: input.targetMuscle,
          imageUrl: input.imageUrl ?? null,
          description: input.description ?? null,
        },
      }),
    )
  } catch (error) {
    return handleUniqueName(error)
  }
}

export const listMachines = async (
  userId: string,
  query: ListMachinesQuery,
) => {
  const where: Prisma.CustomMachineWhereInput = {
    userId,
    ...(query.search
      ? { name: { contains: query.search, mode: 'insensitive' } }
      : {}),
    ...(query.targetMuscle ? { targetMuscle: query.targetMuscle } : {}),
  }
  const orderBy = [
    { [query.sortBy]: query.sortOrder },
    { id: query.sortOrder },
  ] as Prisma.CustomMachineOrderByWithRelationInput[]
  const [items, totalItems] = await Promise.all([
    prisma.customMachine.findMany({
      where,
      orderBy,
      skip: paginationSkip(query),
      take: query.limit,
    }),
    prisma.customMachine.count({ where }),
  ])
  return {
    items: items.map(mapMachine),
    pagination: paginationMetadata(query, totalItems),
  }
}

export const getMachine = async (userId: string, machineId: string) =>
  mapMachine(
    await prisma.$transaction((tx) =>
      requireOwnedMachine(tx, userId, machineId),
    ),
  )

export const updateMachine = async (
  userId: string,
  machineId: string,
  input: UpdateMachineInput,
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      await requireOwnedMachine(tx, userId, machineId)
      const data: Prisma.CustomMachineUpdateInput = {}
      if (input.name !== undefined) data.name = input.name
      if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl
      if (input.targetMuscle !== undefined)
        data.targetMuscle = input.targetMuscle
      if (input.description !== undefined) data.description = input.description
      return mapMachine(
        await tx.customMachine.update({ where: { id: machineId }, data }),
      )
    })
  } catch (error) {
    return handleUniqueName(error)
  }
}

export const deleteMachine = async (
  userId: string,
  machineId: string,
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    await requireOwnedMachine(tx, userId, machineId)
    const referenced = await tx.exerciseLog.findFirst({
      where: { customMachineId: machineId },
      select: { id: true },
    })
    if (referenced)
      throw new AppError(
        409,
        'Machine cannot be deleted because workout history references it',
      )
    await tx.customMachine.delete({ where: { id: machineId } })
  })
}
