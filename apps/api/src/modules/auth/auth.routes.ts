import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import {
  loginRateLimit,
  registrationRateLimit,
} from '../../middlewares/auth-rate-limit.js'
import { validateBody } from '../../middlewares/validate-request.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { login, logout, me, refresh, register } from './auth.controller.js'
import { loginSchema, registerSchema } from './auth.validation.js'

export const authRouter = Router()

authRouter.post(
  '/register',
  registrationRateLimit,
  validateBody(registerSchema),
  asyncHandler(register),
)
authRouter.post(
  '/login',
  loginRateLimit,
  validateBody(loginSchema),
  asyncHandler(login),
)
authRouter.post('/refresh', asyncHandler(refresh))
authRouter.post('/logout', asyncHandler(logout))
authRouter.get('/me', asyncHandler(authenticate), asyncHandler(me))
