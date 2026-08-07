import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import {
  validateBody,
  validateQuery,
} from '../../middlewares/validate-request.js'
import { asyncHandler } from '../../utils/async-handler.js'
import {
  calculateNutritionController,
  getLatestNutritionController,
  getNutritionHistoryController,
  getNutritionProfileInputsController,
} from './nutrition.controller.js'
import {
  calculateNutritionSchema,
  nutritionHistoryQuerySchema,
} from './nutrition.validation.js'

export const nutritionRouter = Router()
nutritionRouter.use(asyncHandler(authenticate))
nutritionRouter.post(
  '/calculate',
  validateBody(calculateNutritionSchema),
  asyncHandler(calculateNutritionController),
)
nutritionRouter.get('/latest', asyncHandler(getLatestNutritionController))
nutritionRouter.get(
  '/history',
  validateQuery(nutritionHistoryQuerySchema),
  asyncHandler(getNutritionHistoryController),
)
nutritionRouter.get(
  '/profile-inputs',
  asyncHandler(getNutritionProfileInputsController),
)
