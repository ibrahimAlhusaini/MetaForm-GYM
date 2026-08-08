import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import {
  validateBody,
  validateQuery,
} from '../../middlewares/validate-request.js'
import { asyncHandler } from '../../utils/async-handler.js'
import {
  createBodyMeasurementController,
  getBodyMeasurementHistoryController,
} from './body-measurement.controller.js'
import {
  bodyMeasurementHistoryQuerySchema,
  createBodyMeasurementSchema,
} from './body-measurement.validation.js'

export const bodyMeasurementRouter = Router()
bodyMeasurementRouter.use(asyncHandler(authenticate))
bodyMeasurementRouter.get(
  '/',
  validateQuery(bodyMeasurementHistoryQuerySchema),
  asyncHandler(getBodyMeasurementHistoryController),
)
bodyMeasurementRouter.post(
  '/',
  validateBody(createBodyMeasurementSchema),
  asyncHandler(createBodyMeasurementController),
)
