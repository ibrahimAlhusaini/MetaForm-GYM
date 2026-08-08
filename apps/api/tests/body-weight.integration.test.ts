import request from 'supertest'
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { UserRole } from '../src/generated/prisma/client.js'
import { app } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { signAccessToken } from '../src/security/jwt.service.js'

const NOW = new Date('2026-08-08T12:00:00.000Z')
let sequence = 0

const availablePrediction = {
  status: 'AVAILABLE',
  previewStatus: 'RESEARCH_PREVIEW',
  method: 'RECENT_TREND',
  methodVersion: 'body-weight-v1-recent-trend-v1',
  forecastHorizonDays: 7,
  predictionDate: NOW.toISOString(),
  targetDate: '2026-08-15T12:00:00.000Z',
  predictedWeightKg: 81.4,
  currentWeightKg: 81.8,
  expectedChangeKg: -0.4,
  interval: {
    available: false,
    lowerKg: null,
    upperKg: null,
    coverageTarget: 0.8,
    method: 'EMPIRICAL',
  },
  reliability: {
    priorMeasurementCount: 12,
    recentCadenceDays: 4,
    reasonCodes: [],
  },
  disclaimerCode: 'EXPERIMENTAL_TREND_FORECAST',
} as const

const clean = async () => {
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'body-weight-test-' } },
  })
}

const createUser = async () => {
  sequence += 1
  const user = await prisma.user.create({
    data: {
      email: `body-weight-test-${String(sequence)}@example.com`,
      passwordHash: 'not-used',
      profile: { create: { fullName: 'Body Weight Tester' } },
    },
  })
  return { user, token: signAccessToken(user.id, UserRole.USER) }
}

const authorized = (method: 'get' | 'post', path: string, token?: string) => {
  const call = request(app)[method](path)
  return token ? call.set('Authorization', `Bearer ${token}`) : call
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  vi.stubGlobal('fetch', vi.fn())
  await clean()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

afterAll(async () => {
  await clean()
  await prisma.$disconnect()
})

describe('body measurement integration', () => {
  it('requires authentication for create and history', async () => {
    expect((await authorized('get', '/api/v1/body-measurements')).status).toBe(
      401,
    )
    expect((await authorized('post', '/api/v1/body-measurements')).status).toBe(
      401,
    )
  })

  it('validates weight and date inputs', async () => {
    const { token } = await createUser()
    const invalidWeight = await authorized(
      'post',
      '/api/v1/body-measurements',
      token,
    ).send({ measuredAt: NOW.toISOString(), weightKg: 0 })
    const future = await authorized(
      'post',
      '/api/v1/body-measurements',
      token,
    ).send({
      measuredAt: new Date(NOW.getTime() + 60_000).toISOString(),
      weightKg: 80,
    })
    expect(invalidWeight.status).toBe(400)
    expect(future.status).toBe(400)
  })

  it('creates user-owned history and updates only the latest profile snapshot', async () => {
    const owner = await createUser()
    const other = await createUser()
    const latest = await authorized(
      'post',
      '/api/v1/body-measurements',
      owner.token,
    ).send({ measuredAt: NOW.toISOString(), weightKg: 81.25 })
    const backdated = await authorized(
      'post',
      '/api/v1/body-measurements',
      owner.token,
    ).send({ measuredAt: '2026-08-01T12:00:00.000Z', weightKg: 83 })
    const history = await authorized(
      'get',
      '/api/v1/body-measurements?page=1&limit=1',
      owner.token,
    )
    const otherHistory = await authorized(
      'get',
      '/api/v1/body-measurements',
      other.token,
    )
    const profile = await prisma.profile.findUniqueOrThrow({
      where: { userId: owner.user.id },
    })
    expect(latest.status).toBe(201)
    expect(backdated.status).toBe(201)
    expect(JSON.parse(history.text) as unknown).toMatchObject({
      data: {
        items: [{ weightKg: 81.25 }],
        pagination: { page: 1, limit: 1, totalItems: 2, totalPages: 2 },
      },
    })
    expect(JSON.parse(otherHistory.text) as unknown).toMatchObject({
      data: { items: [], pagination: { totalItems: 0 } },
    })
    expect(profile.currentWeightKg?.toNumber()).toBe(81.25)
  })

  it('rejects duplicate timestamps and excessive history limits', async () => {
    const { token } = await createUser()
    const payload = { measuredAt: NOW.toISOString(), weightKg: 80 }
    await authorized('post', '/api/v1/body-measurements', token).send(payload)
    const duplicate = await authorized(
      'post',
      '/api/v1/body-measurements',
      token,
    ).send(payload)
    const excessive = await authorized(
      'get',
      '/api/v1/body-measurements?limit=101',
      token,
    )
    expect(duplicate.status).toBe(409)
    expect(excessive.status).toBe(400)
  })
})

describe('body weight prediction integration', () => {
  it('requires authentication and rejects a userId query', async () => {
    const { token } = await createUser()
    expect(
      (await authorized('get', '/api/v1/body-weight/prediction')).status,
    ).toBe(401)
    expect(
      (
        await authorized(
          'get',
          '/api/v1/body-weight/prediction?userId=private',
          token,
        )
      ).status,
    ).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('sends bounded minimized history and returns AVAILABLE', async () => {
    const { user, token } = await createUser()
    await prisma.bodyMeasurement.createMany({
      data: Array.from({ length: 130 }, (_, index) => ({
        userId: user.id,
        measuredAt: new Date(NOW.getTime() - index * 86_400_000),
        weightKg: 80 + index / 100,
      })),
    })
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(availablePrediction), { status: 200 }),
    )
    const response = await authorized(
      'get',
      '/api/v1/body-weight/prediction',
      token,
    )
    expect(response.status).toBe(200)
    expect(JSON.parse(response.text) as unknown).toMatchObject({
      success: true,
      data: { status: 'AVAILABLE', method: 'RECENT_TREND' },
    })
    const fetchOptions = vi.mocked(fetch).mock.calls[0]?.[1]
    if (typeof fetchOptions?.body !== 'string') {
      throw new Error('Expected a serialized JSON prediction payload')
    }
    const payload = JSON.parse(fetchOptions.body) as {
      measurements: Record<string, unknown>[]
    }
    expect(payload.measurements).toHaveLength(120)
    expect(Object.keys(payload.measurements[0] ?? {}).sort()).toEqual([
      'measuredAt',
      'weightKg',
    ])
    expect(JSON.stringify(payload)).not.toMatch(
      /user|email|token|profile|note/i,
    )
  })

  it('forwards a validated ABSTAINED response without a fake prediction', async () => {
    const { token } = await createUser()
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          ...availablePrediction,
          status: 'ABSTAINED',
          predictedWeightKg: null,
          expectedChangeKg: null,
          reliability: {
            priorMeasurementCount: 0,
            recentCadenceDays: null,
            reasonCodes: ['NO_RECENT_MEASUREMENT'],
          },
        }),
        { status: 200 },
      ),
    )
    const response = await authorized(
      'get',
      '/api/v1/body-weight/prediction',
      token,
    )
    expect(JSON.parse(response.text) as unknown).toMatchObject({
      data: {
        status: 'ABSTAINED',
        predictedWeightKg: null,
        reliability: { reasonCodes: ['NO_RECENT_MEASUREMENT'] },
      },
    })
  })

  it.each([
    ['timeout', () => vi.mocked(fetch).mockRejectedValue(new Error('private'))],
    [
      'service error',
      () =>
        vi
          .mocked(fetch)
          .mockResolvedValue(new Response('python internals', { status: 500 })),
    ],
    [
      'malformed response',
      () =>
        vi
          .mocked(fetch)
          .mockResolvedValue(new Response(JSON.stringify({ secret: true }))),
    ],
  ])('maps %s to a safe service-unavailable error', async (_name, arrange) => {
    const { token } = await createUser()
    arrange()
    const response = await authorized(
      'get',
      '/api/v1/body-weight/prediction',
      token,
    )
    expect(response.status).toBe(503)
    expect(JSON.parse(response.text) as unknown).toEqual({
      success: false,
      message: 'Body weight prediction is temporarily unavailable',
      details: { code: 'BODY_WEIGHT_PREDICTION_UNAVAILABLE' },
    })
    expect(response.text).not.toMatch(/private|python|localhost|traceback/i)
  })
})
