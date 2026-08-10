import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { app } from '../src/app.js'
import { parseEnvironment } from '../src/config/env.js'
import { buildBaseCookieOptions } from '../src/security/refresh-cookie.js'

const productionEnvironment = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:password@db.internal/metaform_gym',
  FRONTEND_URL: 'https://app.example.com/',
  JWT_ACCESS_SECRET: 'access-secret-for-validation-only-000000000000',
  JWT_REFRESH_SECRET: 'refresh-secret-for-validation-only-00000000000',
}

describe('production transport hardening', () => {
  it('sets security, explicit CORS, credential, and request-correlation headers', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173')

    expect(response.status).toBe(200)
    expect(response.headers['content-security-policy']).toBeDefined()
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    )
    expect(response.headers['access-control-allow-credentials']).toBe('true')
    expect(response.headers['access-control-expose-headers']).toContain(
      'X-Request-ID',
    )
    expect(response.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
    expect(response.headers['x-powered-by']).toBeUndefined()
  })

  it('does not authorize an unconfigured credentialed origin', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://untrusted.example')

    expect(response.status).toBe(200)
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('maps malformed and oversized JSON to sanitized client errors', async () => {
    const malformed = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":')
    const oversized = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'x'.repeat(33_000), password: 'not-a-secret' })

    expect(malformed.status).toBe(400)
    expect(malformed.body).toEqual({
      success: false,
      message: 'Malformed JSON body',
    })
    expect(oversized.status).toBe(413)
    expect(oversized.body).toEqual({
      success: false,
      message: 'Request body is too large',
    })
  })

  it('keeps core health independent from optional providers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const response = await request(app).get('/api/v1/health')
    vi.unstubAllGlobals()

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ success: true })
  })
})

describe('production environment and cookie policy', () => {
  it('normalizes one explicit HTTP(S) frontend origin and rejects URL paths', () => {
    expect(parseEnvironment(productionEnvironment).FRONTEND_URL).toBe(
      'https://app.example.com',
    )
    for (const FRONTEND_URL of [
      '*',
      'ftp://app.example.com',
      'https://app.example.com/path',
      'https://user:password@app.example.com',
    ]) {
      expect(() =>
        parseEnvironment({ ...productionEnvironment, FRONTEND_URL }),
      ).toThrow()
    }
  })

  it('constructs an encoded TLS database URL from split secret fields', () => {
    const withoutDatabaseUrl = {
      ...productionEnvironment,
      DATABASE_URL: undefined,
    }
    const parsed = parseEnvironment({
      ...withoutDatabaseUrl,
      DATABASE_HOST: 'staging.cluster.internal',
      DATABASE_PORT: '5432',
      DATABASE_NAME: 'metaform_gym',
      DATABASE_USER: 'metaform user',
      DATABASE_PASSWORD: 'p@ss:/word',
    })

    expect(parsed.DATABASE_URL).toBe(
      'postgresql://metaform%20user:p%40ss%3A%2Fword@staging.cluster.internal:5432/metaform_gym?schema=public&sslmode=require',
    )
    expect(parsed).not.toHaveProperty('DATABASE_PASSWORD')
  })

  it('uses a scoped HttpOnly Secure refresh cookie in production', () => {
    expect(buildBaseCookieOptions(true)).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/v1/auth',
    })
  })
})
