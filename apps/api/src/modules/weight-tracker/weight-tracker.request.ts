import type { Request } from 'express'
import type { AppRequest } from '../../types/request.js'
import { AppError } from '../../utils/app-error.js'

export const asAppRequest = (request: Request): AppRequest =>
  request as AppRequest

export const authenticatedUserId = (request: AppRequest): string => {
  if (!request.auth) throw new AppError(401, 'Authentication required')
  return request.auth.userId
}
