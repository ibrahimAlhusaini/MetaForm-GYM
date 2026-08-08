import type {
  BodyMeasurementHistoryResponse,
  BodyMeasurementItem,
} from '@metaform/shared-types'
import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/app-error.js'
import type {
  BodyMeasurementHistoryInput,
  CreateBodyMeasurementInput,
} from './body-measurement.validation.js'

const mapMeasurement = (measurement: {
  id: string
  measuredAt: Date
  weightKg: { toNumber(): number }
  createdAt: Date
}): BodyMeasurementItem => ({
  id: measurement.id,
  measuredAt: measurement.measuredAt.toISOString(),
  weightKg: measurement.weightKg.toNumber(),
  createdAt: measurement.createdAt.toISOString(),
})

const measurementSelection = {
  id: true,
  measuredAt: true,
  weightKg: true,
  createdAt: true,
} as const

export const createBodyMeasurement = async (
  userId: string,
  input: CreateBodyMeasurementInput,
): Promise<BodyMeasurementItem> =>
  prisma.$transaction(async (transaction) => {
    const [duplicate, latest] = await Promise.all([
      transaction.bodyMeasurement.findFirst({
        where: { userId, measuredAt: input.measuredAt },
        select: { id: true },
      }),
      transaction.bodyMeasurement.findFirst({
        where: { userId },
        orderBy: [{ measuredAt: 'desc' }, { id: 'desc' }],
        select: { measuredAt: true },
      }),
    ])
    if (duplicate) {
      throw new AppError(
        409,
        'A body-weight measurement already exists at this time',
      )
    }
    const created = await transaction.bodyMeasurement.create({
      data: {
        userId,
        measuredAt: input.measuredAt,
        weightKg: input.weightKg,
      },
      select: measurementSelection,
    })
    if (!latest || input.measuredAt > latest.measuredAt) {
      await transaction.profile.updateMany({
        where: { userId },
        data: { currentWeightKg: input.weightKg },
      })
    }
    return mapMeasurement(created)
  })

export const getBodyMeasurementHistory = async (
  userId: string,
  input: BodyMeasurementHistoryInput,
): Promise<BodyMeasurementHistoryResponse['data']> => {
  const skip = (input.page - 1) * input.limit
  const [items, totalItems] = await prisma.$transaction([
    prisma.bodyMeasurement.findMany({
      where: { userId },
      orderBy: [{ measuredAt: 'desc' }, { id: 'desc' }],
      skip,
      take: input.limit,
      select: measurementSelection,
    }),
    prisma.bodyMeasurement.count({ where: { userId } }),
  ])
  return {
    items: items.map(mapMeasurement),
    pagination: {
      page: input.page,
      limit: input.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / input.limit),
    },
  }
}
