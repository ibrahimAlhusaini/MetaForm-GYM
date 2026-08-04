import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/prisma.js'
import { verifyAccessToken } from '../security/jwt.service.js'
import type { AppRequest } from '../types/request.js'
import { AppError } from '../utils/app-error.js'

export const authenticate = async (
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> => {
  void _response

  const authorization = request.get('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    throw new AppError(401, 'Authentication required')
  }

  const token = authorization.slice('Bearer '.length).trim()

  if (!token) {
    throw new AppError(401, 'Authentication required')
  }

  const payload = verifyAccessToken(token)
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, isActive: true },
  })

  if (!user) {
    throw new AppError(401, 'Invalid access token')
  }

  if (!user.isActive) {
    throw new AppError(403, 'Account is inactive')
  }

  ;(request as AppRequest).auth = {
    userId: user.id,
    role: user.role,
  }
  next()
}
