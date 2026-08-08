import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { validateQuery } from '../../middlewares/validate-request.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { getBodyWeightPredictionController } from './body-weight-prediction.controller.js'
import { emptyPredictionQuerySchema } from './body-weight-prediction.validation.js'

export const bodyWeightPredictionRouter = Router()
bodyWeightPredictionRouter.get(
  '/',
  asyncHandler(authenticate),
  validateQuery(emptyPredictionQuerySchema),
  asyncHandler(getBodyWeightPredictionController),
)
