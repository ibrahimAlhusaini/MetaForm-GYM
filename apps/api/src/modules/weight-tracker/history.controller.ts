import type { Request, Response } from 'express'
import type { AppRequest } from '../../types/request.js'
import { getSourceHistory } from './history.service.js'
import { authenticatedUserId } from './weight-tracker.request.js'
import type {
  HistoryParams,
  HistoryQuery,
} from './weight-tracker.validation.js'

export const getSourceHistoryController = async (
  request: Request,
  response: Response,
) => {
  const req = request as AppRequest
  response.json({
    success: true,
    data: {
      history: await getSourceHistory(
        authenticatedUserId(req),
        req.validatedParams as HistoryParams,
        req.validatedQuery as HistoryQuery,
      ),
    },
  })
}
