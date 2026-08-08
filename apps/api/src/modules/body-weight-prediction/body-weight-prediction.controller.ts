import type { BodyWeightPredictionResponse } from '@metaform/shared-types'
import type { Request, Response } from 'express'
import type { AppRequest } from '../../types/request.js'
import { AppError } from '../../utils/app-error.js'
import { getBodyWeightPrediction } from './body-weight-prediction.service.js'

export const getBodyWeightPredictionController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const auth = (request as AppRequest).auth
  if (!auth) throw new AppError(401, 'Authentication required')
  const body: BodyWeightPredictionResponse = {
    success: true,
    data: await getBodyWeightPrediction(auth.userId),
  }
  response.status(200).json(body)
}
