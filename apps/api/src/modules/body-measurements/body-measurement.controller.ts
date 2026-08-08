import type {
  BodyMeasurementHistoryResponse,
  BodyMeasurementMutationResponse,
} from '@metaform/shared-types'
import type { Request, Response } from 'express'
import type { AppRequest } from '../../types/request.js'
import { AppError } from '../../utils/app-error.js'
import {
  createBodyMeasurement,
  getBodyMeasurementHistory,
} from './body-measurement.service.js'
import type {
  BodyMeasurementHistoryInput,
  CreateBodyMeasurementInput,
} from './body-measurement.validation.js'

const userId = (request: Request): string => {
  const auth = (request as AppRequest).auth
  if (!auth) throw new AppError(401, 'Authentication required')
  return auth.userId
}

export const createBodyMeasurementController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const body: BodyMeasurementMutationResponse = {
    success: true,
    message: 'Body-weight measurement recorded successfully',
    data: await createBodyMeasurement(
      userId(request),
      (request as AppRequest).validatedBody as CreateBodyMeasurementInput,
    ),
  }
  response.status(201).json(body)
}

export const getBodyMeasurementHistoryController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const body: BodyMeasurementHistoryResponse = {
    success: true,
    data: await getBodyMeasurementHistory(
      userId(request),
      (request as AppRequest).validatedQuery as BodyMeasurementHistoryInput,
    ),
  }
  response.status(200).json(body)
}
