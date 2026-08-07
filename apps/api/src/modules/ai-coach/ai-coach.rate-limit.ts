import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import { env } from '../../config/env.js'
import type { AppRequest } from '../../types/request.js'
import {
  AI_GENERATION_RATE_LIMIT,
  AI_GENERATION_RATE_WINDOW_MS,
} from './ai-coach.constants.js'

export const aiCoachGenerationRateLimit = rateLimit({
  windowMs: AI_GENERATION_RATE_WINDOW_MS,
  limit: AI_GENERATION_RATE_LIMIT,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  keyGenerator: (request) =>
    (request as AppRequest).auth?.userId ??
    ipKeyGenerator(request.ip ?? 'unknown'),
  handler: (_request, response) => {
    response.status(429).json({
      success: false,
      message: 'Too many AI Coach requests, please try again later',
    })
  },
})
