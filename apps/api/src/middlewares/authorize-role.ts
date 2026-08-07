import type { NextFunction, Request, Response } from 'express'
import type { UserRole } from '../generated/prisma/client.js'
import type { AppRequest } from '../types/request.js'
import { AppError } from '../utils/app-error.js'

export const authorizeRole =
  (...allowedRoles: readonly UserRole[]) =>
  (request: Request, _response: Response, next: NextFunction): void => {
    void _response
    const auth = (request as AppRequest).auth
    if (!auth) throw new AppError(401, 'Authentication required')
    if (!allowedRoles.includes(auth.role))
      throw new AppError(403, 'Insufficient permissions')
    next()
  }
