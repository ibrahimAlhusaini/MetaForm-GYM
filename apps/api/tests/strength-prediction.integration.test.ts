import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { prisma } from '../src/config/prisma.js'
import {
  api,
  cleanWeightTrackerData,
  createExercise,
  createMachineViaApi,
  createUser,
  parseResponse,
} from './weight-tracker-test.helpers.js'

const available = {
  status: 'AVAILABLE',
  previewStatus: 'RESEARCH_PREVIEW',
  method: 'LAST_SESSION',
  methodVersion: 'strength-next-session-v1',
  sourceType: 'EXERCISE',
  estimatedNextMaxWeightKg: 80,
  currentMaxWeightKg: 80,
  expectedChangeKg: 0,
  history: { completedSourceSessions: 5, recentCadenceDays: 5 },
  reliability: { reasonCodes: [] },
  disclaimerCode: 'EXPERIMENTAL_STRENGTH_ESTIMATE',
} as const

beforeEach(async () => {
  vi.stubGlobal('fetch', vi.fn())
  await cleanWeightTrackerData()
})
afterEach(() => vi.unstubAllGlobals())
afterAll(async () => {
  await cleanWeightTrackerData()
  await prisma.$disconnect()
})

const path = (type: 'exercise' | 'machine', id: string) =>
  `/api/v1/weight-tracker/sources/${type}/${id}/strength-prediction`

describe('strength prediction integration', () => {
  it('requires authentication and validates source existence', async () => {
    const { token } = await createUser()
    const missing = '00000000-0000-4000-8000-000000000000'
    expect((await api().get(path('exercise', missing))).status).toBe(401)
    expect((await api(token).get(path('exercise', missing))).status).toBe(404)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('enforces Custom Machine ownership with a safe 404', async () => {
    const owner = await createUser()
    const other = await createUser()
    const machine = await createMachineViaApi(owner.token)
    expect(
      (await api(other.token).get(path('machine', machine.id))).status,
    ).toBe(404)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('sends bounded exact-source completed working maxima and maps AVAILABLE', async () => {
    const { user, token } = await createUser()
    const exercise = await createExercise()
    const other = await createExercise('Other Exercise')
    for (let index = 0; index < 32; index += 1) {
      await prisma.workoutSession.create({
        data: {
          userId: user.id,
          startedAt: new Date(Date.UTC(2026, 0, index + 1, 9)),
          completedAt: new Date(Date.UTC(2026, 0, index + 1, 10)),
          exerciseLogs: {
            create: [
              {
                exerciseId: exercise.id,
                orderIndex: 0,
                sets: {
                  create: [
                    { setNumber: 1, weightKg: 50 + index, isWarmup: false },
                    { setNumber: 2, weightKg: 999, isWarmup: true },
                    { setNumber: 3, weightKg: null, isWarmup: false },
                  ],
                },
              },
              {
                exerciseId: other.id,
                orderIndex: 1,
                sets: { create: { setNumber: 1, weightKg: 500 } },
              },
            ],
          },
        },
      })
    }
    for (const excluded of [
      { completedAt: null, weightKg: 997, isWarmup: false },
      {
        completedAt: new Date(Date.UTC(2026, 1, 2, 10)),
        weightKg: 998,
        isWarmup: true,
      },
      {
        completedAt: new Date(Date.UTC(2026, 1, 3, 10)),
        weightKg: null,
        isWarmup: false,
      },
    ]) {
      await prisma.workoutSession.create({
        data: {
          userId: user.id,
          startedAt: new Date(Date.UTC(2026, 1, 2, 9)),
          completedAt: excluded.completedAt,
          exerciseLogs: {
            create: {
              exerciseId: exercise.id,
              orderIndex: 0,
              sets: {
                create: {
                  setNumber: 1,
                  weightKg: excluded.weightKg,
                  isWarmup: excluded.isWarmup,
                },
              },
            },
          },
        },
      })
    }
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(available), { status: 200 }),
    )
    const response = await api(token).get(path('exercise', exercise.id))
    expect(response.status).toBe(200)
    expect(parseResponse(response)).toMatchObject({
      success: true,
      data: { status: 'AVAILABLE', method: 'LAST_SESSION' },
    })
    const options = vi.mocked(fetch).mock.calls[0]?.[1]
    if (typeof options?.body !== 'string') throw new Error('Expected JSON body')
    const payload = JSON.parse(options.body) as {
      sourceType: string
      sessions: Record<string, unknown>[]
    }
    expect(payload.sourceType).toBe('EXERCISE')
    expect(payload.sessions).toHaveLength(30)
    expect(payload.sessions.at(-1)).toEqual({
      completedAt: '2026-02-01T10:00:00.000Z',
      maxWeightKg: 81,
    })
    expect(Object.keys(payload.sessions[0] ?? {}).sort()).toEqual([
      'completedAt',
      'maxWeightKg',
    ])
    expect(JSON.stringify(payload)).not.toMatch(
      /user|email|token|profile|note|sourceId/i,
    )
  })

  it('maps ABSTAINED and all Python failures safely', async () => {
    const { token } = await createUser()
    const exercise = await createExercise()
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...available,
          status: 'ABSTAINED',
          estimatedNextMaxWeightKg: null,
          currentMaxWeightKg: null,
          expectedChangeKg: null,
          history: { completedSourceSessions: 0, recentCadenceDays: null },
          reliability: { reasonCodes: ['NO_COMPLETED_SOURCE_HISTORY'] },
        }),
      ),
    )
    const abstained = await api(token).get(path('exercise', exercise.id))
    expect(parseResponse(abstained)).toMatchObject({
      data: {
        status: 'ABSTAINED',
        estimatedNextMaxWeightKg: null,
        reliability: { reasonCodes: ['NO_COMPLETED_SOURCE_HISTORY'] },
      },
    })
    for (const response of [
      () => Promise.reject(new Error('private traceback')),
      () => Promise.reject(new DOMException('timed out', 'AbortError')),
      () => Promise.resolve(new Response('python internals', { status: 500 })),
      () => Promise.resolve(new Response(JSON.stringify({ secret: true }))),
      () =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              ...available,
              status: 'AVAILABLE',
              estimatedNextMaxWeightKg: null,
            }),
          ),
        ),
    ]) {
      vi.mocked(fetch).mockImplementationOnce(response)
      const failure = await api(token).get(path('exercise', exercise.id))
      expect(failure.status).toBe(503)
      expect(failure.text).not.toMatch(/private|python|traceback|secret/i)
      expect(parseResponse(failure)).toMatchObject({
        details: { code: 'STRENGTH_PREDICTION_UNAVAILABLE' },
      })
    }
  })

  it('serves an owned Custom Machine without mixing source identity', async () => {
    const owner = await createUser()
    const machine = await createMachineViaApi(owner.token)
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ ...available, sourceType: 'CUSTOM_MACHINE' }),
      ),
    )
    const response = await api(owner.token).get(path('machine', machine.id))
    expect(response.status).toBe(200)
    const options = vi.mocked(fetch).mock.calls[0]?.[1]
    if (typeof options?.body !== 'string') throw new Error('Expected JSON body')
    expect(JSON.parse(options.body)).toEqual({
      sourceType: 'CUSTOM_MACHINE',
      sessions: [],
    })

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ...available, sourceType: 'EXERCISE' })),
    )
    expect(
      (await api(owner.token).get(path('machine', machine.id))).status,
    ).toBe(503)
  })
})
