import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { validateBody } from '../../middlewares/validate-request.js'
import { asyncHandler } from '../../utils/async-handler.js'
import {
  getProfileCompletenessController,
  getProfileController,
  getProfileSummaryController,
  updateProfileController,
} from './profile.controller.js'
import { updateProfileSchema } from './profile.validation.js'

export const profileRouter = Router()

profileRouter.use(asyncHandler(authenticate))
profileRouter.get('/', asyncHandler(getProfileController))
profileRouter.patch(
  '/',
  validateBody(updateProfileSchema),
  asyncHandler(updateProfileController),
)
profileRouter.get(
  '/completeness',
  asyncHandler(getProfileCompletenessController),
)
profileRouter.get('/summary', asyncHandler(getProfileSummaryController))
