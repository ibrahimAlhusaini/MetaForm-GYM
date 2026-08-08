import type { CookieOptions, Response } from 'express'
import { env } from '../config/env.js'

export const REFRESH_COOKIE_PATH = '/api/v1/auth'

export const buildBaseCookieOptions = (production: boolean): CookieOptions => ({
  httpOnly: true,
  path: REFRESH_COOKIE_PATH,
  sameSite: 'lax',
  secure: production,
})

const getBaseCookieOptions = (): CookieOptions =>
  buildBaseCookieOptions(env.NODE_ENV === 'production')

export const setRefreshTokenCookie = (
  response: Response,
  refreshToken: string,
): void => {
  response.cookie(env.COOKIE_NAME, refreshToken, {
    ...getBaseCookieOptions(),
    maxAge: env.JWT_REFRESH_EXPIRES_IN * 1000,
  })
}

export const clearRefreshTokenCookie = (response: Response): void => {
  response.clearCookie(env.COOKIE_NAME, getBaseCookieOptions())
}
