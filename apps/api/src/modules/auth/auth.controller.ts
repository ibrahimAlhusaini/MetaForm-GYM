import type { Request, Response } from 'express'
import { env } from '../../config/env.js'
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from '../../security/refresh-cookie.js'
import type { AppRequest } from '../../types/request.js'
import { AppError } from '../../utils/app-error.js'
import {
  getAuthenticatedUser,
  loginUser,
  registerUser,
  revokeRefreshToken,
  rotateRefreshToken,
} from './auth.service.js'
import type { RequestMetadata } from './auth.types.js'
import type { LoginInput, RegisterInput } from './auth.validation.js'

const getRequestMetadata = (request: Request): RequestMetadata => ({
  userAgent: request.get('user-agent')?.slice(0, 512) ?? null,
  ipAddress: request.ip?.slice(0, 45) ?? null,
})

const getRefreshTokenCookie = (request: Request): string | undefined => {
  const cookies: unknown = request.cookies

  if (typeof cookies !== 'object' || cookies === null) {
    return undefined
  }

  const value = (cookies as Record<string, unknown>)[env.COOKIE_NAME]
  return typeof value === 'string' ? value : undefined
}

export const register = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const input = (request as AppRequest).validatedBody as RegisterInput
  const result = await registerUser(input, getRequestMetadata(request))

  setRefreshTokenCookie(response, result.refreshToken)
  response.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  })
}

export const login = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const input = (request as AppRequest).validatedBody as LoginInput
  const result = await loginUser(input, getRequestMetadata(request))

  setRefreshTokenCookie(response, result.refreshToken)
  response.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  })
}

export const refresh = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const refreshToken = getRefreshTokenCookie(request)

  if (!refreshToken) {
    throw new AppError(401, 'Refresh token required')
  }

  const result = await rotateRefreshToken(
    refreshToken,
    getRequestMetadata(request),
  )

  setRefreshTokenCookie(response, result.refreshToken)
  response.status(200).json({
    success: true,
    message: 'Access token refreshed',
    data: {
      accessToken: result.accessToken,
    },
  })
}

export const logout = async (
  request: Request,
  response: Response,
): Promise<void> => {
  await revokeRefreshToken(getRefreshTokenCookie(request))
  clearRefreshTokenCookie(response)

  response.status(200).json({
    success: true,
    message: 'Logout successful',
  })
}

export const me = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const auth = (request as AppRequest).auth

  if (!auth) {
    throw new AppError(401, 'Authentication required')
  }

  const user = await getAuthenticatedUser(auth.userId)

  response.status(200).json({
    success: true,
    data: { user },
  })
}
