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
  FIXED_NOW,
  cleanDashboardTestData,
  createCustomMachine,
  createDashboardUser,
  createExercise,
  createExerciseLog,
  createSession,
  getDashboard,
  parseDashboard,
  utcDate,
} from './dashboard-test.helpers.js'

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(FIXED_NOW)
  await cleanDashboardTestData()
})

afterEach(() => {
  vi.useRealTimers()
})

afterAll(async () => {
  await cleanDashboardTestData()
  await prisma.$disconnect()
})

describe('dashboard strength integration', () => {
  it('excludes warmup sets from strength progress', async () => {
    const { user, accessToken } = await createDashboardUser()
    const exercise = await createExercise()
    const session = await createSession(user.id, {
      startedAt: utcDate(0, 8),
      completedAt: utcDate(0, 9),
    })
    await createExerciseLog({
      workoutSessionId: session.id,
      exerciseId: exercise.id,
      orderIndex: 0,
      sets: [
        { weightKg: '100', isWarmup: true },
        { weightKg: '55', isWarmup: false },
      ],
    })

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.strengthProgress.machines[0]?.personalRecordKg).toBe(55)
  })

  it('excludes incomplete sessions from strength progress', async () => {
    const { user, accessToken } = await createDashboardUser()
    const exercise = await createExercise()
    const completed = await createSession(user.id, {
      startedAt: utcDate(-1, 8),
      completedAt: utcDate(-1, 9),
    })
    const incomplete = await createSession(user.id, {
      startedAt: utcDate(0, 8),
      completedAt: null,
    })
    await Promise.all([
      createExerciseLog({
        workoutSessionId: completed.id,
        exerciseId: exercise.id,
        orderIndex: 0,
        sets: [{ weightKg: '50' }],
      }),
      createExerciseLog({
        workoutSessionId: incomplete.id,
        exerciseId: exercise.id,
        orderIndex: 0,
        sets: [{ weightKg: '100' }],
      }),
    ])

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.strengthProgress.machines[0]).toMatchObject({
      personalRecordKg: 50,
      totalSessions: 1,
    })
  })

  it('uses the maximum qualifying weight as the personal record', async () => {
    const { user, accessToken } = await createDashboardUser()
    const exercise = await createExercise()
    const session = await createSession(user.id, {
      startedAt: utcDate(0, 8),
      completedAt: utcDate(0, 9),
    })
    await createExerciseLog({
      workoutSessionId: session.id,
      exerciseId: exercise.id,
      orderIndex: 0,
      sets: [{ weightKg: '45.25' }, { weightKg: '57.555' }, { weightKg: null }],
    })

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.strengthProgress.machines[0]?.personalRecordKg).toBe(57.56)
  })

  it('returns one representative point per source and session', async () => {
    const { user, accessToken } = await createDashboardUser()
    const exercise = await createExercise()
    const firstSession = await createSession(user.id, {
      startedAt: utcDate(-2, 8),
      completedAt: utcDate(-2, 9),
    })
    const latestSession = await createSession(user.id, {
      startedAt: utcDate(0, 8),
      completedAt: utcDate(0, 9),
    })
    await Promise.all([
      createExerciseLog({
        workoutSessionId: firstSession.id,
        exerciseId: exercise.id,
        orderIndex: 0,
        sets: [{ weightKg: '45' }, { weightKg: '50' }],
      }),
      createExerciseLog({
        workoutSessionId: firstSession.id,
        exerciseId: exercise.id,
        orderIndex: 1,
        sets: [{ weightKg: '55' }],
      }),
      createExerciseLog({
        workoutSessionId: latestSession.id,
        exerciseId: exercise.id,
        orderIndex: 0,
        sets: [{ weightKg: '60' }],
      }),
    ])

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.strengthProgress.machines[0]).toMatchObject({
      personalRecordKg: 60,
      latestWeightKg: 60,
      previousWeightKg: 55,
      changeKg: 5,
      percentageChange: 9.09,
      totalSessions: 2,
      points: [
        { date: '2026-08-03', weightKg: 55 },
        { date: '2026-08-05', weightKg: 60 },
      ],
    })
  })

  it('keeps an exercise and custom machine with the same name separate', async () => {
    const { user, accessToken } = await createDashboardUser()
    const exercise = await createExercise('Chest Press')
    const machine = await createCustomMachine(user.id, 'Chest Press')
    const session = await createSession(user.id, {
      startedAt: utcDate(0, 8),
      completedAt: utcDate(0, 9),
    })
    await Promise.all([
      createExerciseLog({
        workoutSessionId: session.id,
        exerciseId: exercise.id,
        orderIndex: 0,
        sets: [{ weightKg: '60' }],
      }),
      createExerciseLog({
        workoutSessionId: session.id,
        customMachineId: machine.id,
        orderIndex: 1,
        sets: [{ weightKg: '70' }],
      }),
    ])

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.strengthProgress.machines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceType: 'EXERCISE',
          sourceId: exercise.id,
          name: 'Chest Press',
        }),
        expect.objectContaining({
          sourceType: 'CUSTOM_MACHINE',
          sourceId: machine.id,
          name: 'Chest Press',
        }),
      ]),
    )
  })

  it('returns only the five most recently trained sources', async () => {
    const { user, accessToken } = await createDashboardUser()

    for (let index = 0; index < 6; index += 1) {
      const exercise = await createExercise(`Exercise ${String(index)}`)
      const session = await createSession(user.id, {
        startedAt: utcDate(-index, 8),
        completedAt: utcDate(-index, 9),
      })
      await createExerciseLog({
        workoutSessionId: session.id,
        exerciseId: exercise.id,
        orderIndex: 0,
        sets: [{ weightKg: String(50 + index) }],
      })
    }

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.strengthProgress.machines).toHaveLength(5)
    expect(
      body.data.strengthProgress.machines.map((machine) => machine.name),
    ).not.toContain('Exercise 5')
  })

  it('returns only the latest twelve points while preserving total sessions', async () => {
    const { user, accessToken } = await createDashboardUser()
    const exercise = await createExercise()

    for (let index = 0; index < 13; index += 1) {
      const session = await createSession(user.id, {
        startedAt: utcDate(-index, 8),
        completedAt: utcDate(-index, 9),
      })
      await createExerciseLog({
        workoutSessionId: session.id,
        exerciseId: exercise.id,
        orderIndex: 0,
        sets: [{ weightKg: String(50 + index) }],
      })
    }

    const body = parseDashboard(await getDashboard(accessToken))
    const machine = body.data.strengthProgress.machines[0]
    expect(machine?.points).toHaveLength(12)
    expect(machine?.totalSessions).toBe(13)
    expect(machine?.points[0]?.date).toBe('2026-07-25')
  })

  it('does not expose another user strength data', async () => {
    const owner = await createDashboardUser()
    const viewer = await createDashboardUser()
    const machine = await createCustomMachine(owner.user.id)
    const session = await createSession(owner.user.id, {
      startedAt: utcDate(0, 8),
      completedAt: utcDate(0, 9),
    })
    await createExerciseLog({
      workoutSessionId: session.id,
      customMachineId: machine.id,
      orderIndex: 0,
      sets: [{ weightKg: '75' }],
    })

    const body = parseDashboard(await getDashboard(viewer.accessToken))
    expect(body.data.strengthProgress.machines).toEqual([])
  })

  it('serializes Decimal strength values as finite JavaScript numbers', async () => {
    const { user, accessToken } = await createDashboardUser()
    const exercise = await createExercise()
    const session = await createSession(user.id, {
      startedAt: utcDate(0, 8),
      completedAt: utcDate(0, 9),
    })
    await createExerciseLog({
      workoutSessionId: session.id,
      exerciseId: exercise.id,
      orderIndex: 0,
      sets: [{ weightKg: '52.345' }],
    })

    const body = parseDashboard(await getDashboard(accessToken))
    const value = body.data.strengthProgress.machines[0]?.latestWeightKg
    expect(value).toBe(52.35)
    expect(Number.isFinite(value)).toBe(true)
  })
})
