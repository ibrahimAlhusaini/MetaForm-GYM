import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../middlewares/validate-request.js'
import { asyncHandler } from '../../utils/async-handler.js'
import {
  createAiCoachSessionController,
  getAiCoachSessionController,
  listAiCoachCapabilitiesController,
  listAiCoachSessionsController,
} from './ai-coach.controller.js'
import { aiCoachGenerationRateLimit } from './ai-coach.rate-limit.js'
import {
  aiCoachHistorySchema,
  aiCoachSessionParamsSchema,
  createAiCoachSessionSchema,
} from './ai-coach.validation.js'

export const aiCoachRouter = Router()
aiCoachRouter.use(asyncHandler(authenticate))
aiCoachRouter.get('/capabilities', listAiCoachCapabilitiesController)
aiCoachRouter.post(
  '/sessions',
  aiCoachGenerationRateLimit,
  validateBody(createAiCoachSessionSchema),
  asyncHandler(createAiCoachSessionController),
)
aiCoachRouter.get(
  '/sessions',
  validateQuery(aiCoachHistorySchema),
  asyncHandler(listAiCoachSessionsController),
)
aiCoachRouter.get(
  '/sessions/:sessionId',
  validateParams(aiCoachSessionParamsSchema),
  asyncHandler(getAiCoachSessionController),
)
