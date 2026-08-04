import request, { type Response } from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { env } from '../src/config/env.js'
import { prisma } from '../src/config/prisma.js'
import { hashRefreshToken } from '../src/security/token-hash.js'

const validRegistration = {
  fullName: 'Example User',
  email: 'user@example.com',
  password: 'SecurePassword123!',
}

interface AuthResponseBody {
  success: boolean
  message: string
  data: {
    user: {
      id: string
      email: string
      role: string
      profile: { fullName: string } | null
    }
    accessToken: string
  }
}

const parseBody = (response: Response): unknown =>
  JSON.parse(response.text) as unknown

const getSetCookies = (response: Response): string[] => {
  const header: unknown = response.headers['set-cookie']

  if (typeof header === 'string') {
    return [header]
  }

  if (
    Array.isArray(header) &&
    header.every((value) => typeof value === 'string')
  ) {
    return header
  }

  throw new Error('Expected a Set-Cookie response header')
}

const getCookiePair = (response: Response): string => {
  const cookie = getSetCookies(response)[0]

  if (!cookie) {
    throw new Error('Expected a refresh cookie')
  }

  return cookie.split(';', 1)[0] ?? ''
}

const getRawCookieValue = (response: Response): string => {
  const cookiePair = getCookiePair(response)
  const separatorIndex = cookiePair.indexOf('=')

  if (separatorIndex < 0) {
    throw new Error('Refresh cookie is malformed')
  }

  return cookiePair.slice(separatorIndex + 1)
}

const register = () =>
  request(app).post('/api/v1/auth/register').send(validRegistration)

beforeEach(async () => {
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.user.deleteMany()
  await prisma.$disconnect()
})

describe('authentication integration', () => {
  it('registers a user and sets a safe refresh cookie', async () => {
    const response = await register()
    const body = parseBody(response) as AuthResponseBody
    const cookie = getSetCookies(response)[0] ?? ''

    expect(response.status).toBe(201)
    expect(body).toMatchObject({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          email: validRegistration.email,
          role: 'USER',
          profile: { fullName: validRegistration.fullName },
        },
      },
    })
    expect(body.data.accessToken).toEqual(expect.any(String))
    expect(cookie).toContain(`${env.COOKIE_NAME}=`)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Path=/api/v1/auth')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).not.toContain('Secure')
  })

  it('rejects duplicate normalized emails', async () => {
    await register()
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validRegistration,
        email: '  USER@EXAMPLE.COM ',
      })

    expect(response.status).toBe(409)
    expect(parseBody(response)).toEqual({
      success: false,
      message: 'An account with this email already exists',
    })
  })

  it('rejects a password that does not meet policy', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validRegistration,
        password: 'weakpassword',
      })

    expect(response.status).toBe(400)
    expect(parseBody(response)).toEqual({
      success: false,
      message: 'Invalid request data',
    })
  })

  it('logs in with valid credentials', async () => {
    await register()
    const response = await request(app).post('/api/v1/auth/login').send({
      email: validRegistration.email,
      password: validRegistration.password,
    })
    const body = parseBody(response) as AuthResponseBody

    expect(response.status).toBe(200)
    expect(body.message).toBe('Login successful')
    expect(body.data.accessToken).toEqual(expect.any(String))
    expect(getSetCookies(response)[0]).toContain('HttpOnly')
  })

  it('uses a generic error for an invalid password', async () => {
    await register()
    const response = await request(app).post('/api/v1/auth/login').send({
      email: validRegistration.email,
      password: 'IncorrectPassword123!',
    })

    expect(response.status).toBe(401)
    expect(parseBody(response)).toEqual({
      success: false,
      message: 'Invalid email or password',
    })
  })

  it('uses the same generic error for an unknown email', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'unknown@example.com',
      password: 'IncorrectPassword123!',
    })

    expect(response.status).toBe(401)
    expect(parseBody(response)).toEqual({
      success: false,
      message: 'Invalid email or password',
    })
  })

  it('rejects a protected route without a token', async () => {
    const response = await request(app).get('/api/v1/auth/me')

    expect(response.status).toBe(401)
    expect(parseBody(response)).toEqual({
      success: false,
      message: 'Authentication required',
    })
  })

  it('returns the current user with a valid access token', async () => {
    const registration = await register()
    const accessToken = (parseBody(registration) as AuthResponseBody).data
      .accessToken
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(200)
    expect(parseBody(response)).toMatchObject({
      success: true,
      data: {
        user: {
          email: validRegistration.email,
          isActive: true,
          profile: {
            fullName: validRegistration.fullName,
            gender: null,
            currentWeightKg: null,
          },
        },
      },
    })
  })

  it('refreshes access with a valid cookie', async () => {
    const registration = await register()
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', getCookiePair(registration))
    const body = parseBody(response) as { data: { accessToken: string } }

    expect(response.status).toBe(200)
    expect(body.data.accessToken).toEqual(expect.any(String))
    expect(getSetCookies(response)[0]).toContain('HttpOnly')
  })

  it('rotates and revokes the previous refresh token', async () => {
    const registration = await register()
    const oldRawToken = getRawCookieValue(registration)
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', getCookiePair(registration))
    const newRawToken = getRawCookieValue(response)
    const oldRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(oldRawToken) },
    })

    expect(response.status).toBe(200)
    expect(newRawToken).not.toBe(oldRawToken)
    expect(oldRecord?.revokedAt).not.toBeNull()
  })

  it('rejects reuse of a revoked refresh token', async () => {
    const registration = await register()
    const oldCookie = getCookiePair(registration)

    await request(app).post('/api/v1/auth/refresh').set('Cookie', oldCookie)
    const replay = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', oldCookie)

    expect(replay.status).toBe(401)
    expect(parseBody(replay)).toEqual({
      success: false,
      message: 'Invalid refresh token',
    })
  })

  it('logs out, revokes the current token, and clears the cookie', async () => {
    const registration = await register()
    const rawToken = getRawCookieValue(registration)
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', getCookiePair(registration))
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(rawToken) },
    })
    const clearedCookie = getSetCookies(response)[0] ?? ''

    expect(response.status).toBe(200)
    expect(tokenRecord?.revokedAt).not.toBeNull()
    expect(clearedCookie).toContain(`${env.COOKIE_NAME}=`)
    expect(clearedCookie).toContain('Expires=Thu, 01 Jan 1970')
    expect(clearedCookie).toContain('HttpOnly')
  })

  it('rejects an inactive user with valid credentials', async () => {
    const registration = await register()
    const userId = (parseBody(registration) as AuthResponseBody).data.user.id

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    })
    const response = await request(app).post('/api/v1/auth/login').send({
      email: validRegistration.email,
      password: validRegistration.password,
    })

    expect(response.status).toBe(403)
    expect(parseBody(response)).toEqual({
      success: false,
      message: 'Account is inactive',
    })
  })

  it('never returns a password hash', async () => {
    const registration = await register()
    const registrationBody = parseBody(registration) as AuthResponseBody
    const meResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${registrationBody.data.accessToken}`)

    expect(registration.text).not.toContain('passwordHash')
    expect(meResponse.text).not.toContain('passwordHash')
  })

  it('stores only a hash of the refresh token', async () => {
    const registration = await register()
    const rawToken = getRawCookieValue(registration)
    const storedSession = await prisma.refreshToken.findFirstOrThrow()

    expect(storedSession.tokenHash).not.toBe(rawToken)
    expect(storedSession.tokenHash).toBe(hashRefreshToken(rawToken))
    expect(storedSession.tokenHash).toMatch(/^[a-f0-9]{64}$/)
  })
})
