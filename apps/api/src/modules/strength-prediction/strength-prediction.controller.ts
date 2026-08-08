import type { Request, Response } from 'express'
import type { AppRequest } from '../../types/request.js'
import { authenticatedUserId } from '../weight-tracker/weight-tracker.request.js'
import type { HistoryParams } from '../weight-tracker/weight-tracker.validation.js'
import { getStrengthPrediction } from './strength-prediction.service.js'

export const getStrengthPredictionController = async (
  request: Request,
  response: Response,
) => {
  const req = request as AppRequest
  response.json({
    success: true,
    data: await getStrengthPrediction(
      authenticatedUserId(req),
      req.validatedParams as HistoryParams,
    ),
  })
}
