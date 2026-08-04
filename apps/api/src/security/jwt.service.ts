import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { UserRole } from '../generated/prisma/client.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/app-error.js'

const JWT_ALGORITHM = 'HS256'
const JWT_ISSUER = 'metaform-api'
const JWT_AUDIENCE = 'metaform-web'

const accessTokenPayloadSchema = z.object({
  sub: z.uuid(),
  role: z.enum(UserRole),
  type: z.literal('access'),
})

const refreshTokenPayloadSchema = z.object({
  sub: z.uuid(),
  jti: z.uuid(),
  type: z.literal('refresh'),
})

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>
export type RefreshTokenPayload = z.infer<typeof refreshTokenPayloadSchema>

export const signAccessToken = (userId: string, role: UserRole): string => {
  return jwt.sign({ role, type: 'access' }, env.JWT_ACCESS_SECRET, {
    algorithm: JWT_ALGORITHM,
    audience: JWT_AUDIENCE,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: JWT_ISSUER,
    subject: userId,
  })
}

export const signRefreshToken = (userId: string, tokenId: string): string => {
  return jwt.sign({ type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    algorithm: JWT_ALGORITHM,
    audience: JWT_AUDIENCE,
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: JWT_ISSUER,
    jwtid: tokenId,
    subject: userId,
  })
}

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: [JWT_ALGORITHM],
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
    })

    return accessTokenPayloadSchema.parse(payload)
  } catch {
    throw new AppError(401, 'Invalid access token')
  }
}

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      algorithms: [JWT_ALGORITHM],
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
    })

    return refreshTokenPayloadSchema.parse(payload)
  } catch {
    throw new AppError(401, 'Invalid refresh token')
  }
}

export const getRefreshTokenExpiration = (): Date => {
  return new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN * 1000)
}
