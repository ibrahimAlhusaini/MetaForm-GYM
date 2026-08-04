import { rateLimit } from 'express-rate-limit'
import { env } from '../config/env.js'

const createAuthRateLimit = (limit: number) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    handler: (_request, response) => {
      response.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
      })
    },
  })

export const registrationRateLimit = createAuthRateLimit(5)
export const loginRateLimit = createAuthRateLimit(10)
