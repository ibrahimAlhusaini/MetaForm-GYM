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
  createDashboardUser,
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

describe('dashboard overview integration', () => {
  it('rejects an unauthenticated request', async () => {
    const response = await getDashboard()

    expect(response.status).toBe(401)
    expect(JSON.parse(response.text) as unknown).toEqual({
      success: false,
      message: 'Authentication required',
    })
  })

  it('returns a successful empty dashboard for a new user', async () => {
    const { accessToken } = await createDashboardUser()
    const response = await getDashboard(accessToken)
    const body = parseDashboard(response)

    expect(response.status).toBe(200)
    expect(body.data).toMatchObject({
      user: { firstName: 'Dashboard' },
      overview: {
        currentBodyWeightKg: null,
        dailyCalories: null,
        currentWorkoutStreak: 0,
        workoutsCompleted: 0,
        lastWorkout: null,
        weeklyProgress: {
          completedWorkouts: 0,
          previousWeekCompletedWorkouts: 0,
          percentageChange: 0,
        },
      },
      bodyWeightProgress: {
        points: [],
        trend: {
          direction: 'INSUFFICIENT_DATA',
          changeKg: null,
          percentageChange: null,
        },
      },
      strengthProgress: { machines: [] },
      meta: {
        generatedAt: FIXED_NOW.toISOString(),
        bodyWeightDataAvailable: false,
        strengthDataAvailable: false,
      },
    })
  })

  it('prefers the latest body measurement over profile weight', async () => {
    const { user, accessToken } = await createDashboardUser('81.25')
    await prisma.bodyMeasurement.createMany({
      data: [
        { userId: user.id, weightKg: '79.50', measuredAt: utcDate(-3) },
        { userId: user.id, weightKg: '78.55', measuredAt: utcDate(-1) },
      ],
    })

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.overview.currentBodyWeightKg).toBe(78.55)
  })

  it('uses profile weight when no measurement exists', async () => {
    const { accessToken } = await createDashboardUser('81.25')

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.overview.currentBodyWeightKg).toBe(81.25)
  })

  it('uses the most recent nutrition calculation', async () => {
    const { user, accessToken } = await createDashboardUser()
    const calculation = (maintenanceCalories: number, calculatedAt: Date) => ({
      userId: user.id,
      bmi: '23.10',
      bmr: '1700',
      tdee: '2400',
      maintenanceCalories,
      bulkingCalories: maintenanceCalories + 300,
      cuttingCalories: maintenanceCalories - 300,
      proteinGrams: '150',
      carbohydrateGrams: '250',
      fatGrams: '70',
      waterLiters: '2.50',
      calculatedAt,
    })
    await prisma.nutritionCalculation.createMany({
      data: [calculation(2200, utcDate(-5)), calculation(2450, utcDate(-1))],
    })

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.overview.dailyCalories).toBe(2450)
  })

  it('counts completed workouts and excludes incomplete sessions', async () => {
    const { user, accessToken } = await createDashboardUser()
    await Promise.all([
      createSession(user.id, {
        startedAt: utcDate(-2, 9),
        completedAt: utcDate(-2, 10),
      }),
      createSession(user.id, {
        startedAt: utcDate(-1, 9),
        completedAt: utcDate(-1, 10),
      }),
      createSession(user.id, {
        startedAt: utcDate(0, 9),
        completedAt: null,
      }),
    ])

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.overview.workoutsCompleted).toBe(2)
  })

  it('counts multiple sessions on one day as one streak day', async () => {
    const { user, accessToken } = await createDashboardUser()
    await Promise.all([
      createSession(user.id, {
        startedAt: utcDate(0, 7),
        completedAt: utcDate(0, 8),
      }),
      createSession(user.id, {
        startedAt: utcDate(0, 17),
        completedAt: utcDate(0, 18),
      }),
      createSession(user.id, {
        startedAt: utcDate(-1, 7),
        completedAt: utcDate(-1, 8),
      }),
    ])

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.overview.currentWorkoutStreak).toBe(2)
  })

  it('calculates a streak ending today', async () => {
    const { user, accessToken } = await createDashboardUser()
    await Promise.all(
      [0, -1, -2].map((day) =>
        createSession(user.id, {
          startedAt: utcDate(day, 8),
          completedAt: utcDate(day, 9),
        }),
      ),
    )

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.overview.currentWorkoutStreak).toBe(3)
  })

  it('calculates a streak ending yesterday', async () => {
    const { user, accessToken } = await createDashboardUser()
    await Promise.all(
      [-1, -2].map((day) =>
        createSession(user.id, {
          startedAt: utcDate(day, 8),
          completedAt: utcDate(day, 9),
        }),
      ),
    )

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.overview.currentWorkoutStreak).toBe(2)
  })

  it('returns zero when the current workout streak is broken', async () => {
    const { user, accessToken } = await createDashboardUser()
    await createSession(user.id, {
      startedAt: utcDate(-2, 8),
      completedAt: utcDate(-2, 9),
    })

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.overview.currentWorkoutStreak).toBe(0)
  })

  it('returns the latest workout and its duration', async () => {
    const { user, accessToken } = await createDashboardUser()
    const latest = await createSession(user.id, {
      startedAt: new Date('2026-08-05T09:00:00.000Z'),
      completedAt: new Date('2026-08-05T10:04:59.000Z'),
    })

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.overview.lastWorkout).toEqual({
      id: latest.id,
      startedAt: '2026-08-05T09:00:00.000Z',
      completedAt: '2026-08-05T10:04:59.000Z',
      durationMinutes: 64,
    })
  })

  it('returns current and previous UTC weekly counts and percentage', async () => {
    const { user, accessToken } = await createDashboardUser()
    await Promise.all(
      [-2, -1, 0, -8, -7].map((day) =>
        createSession(user.id, {
          startedAt: utcDate(day, 8),
          completedAt: utcDate(day, 9),
        }),
      ),
    )

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.overview.weeklyProgress).toEqual({
      completedWorkouts: 3,
      previousWeekCompletedWorkouts: 2,
      percentageChange: 50,
    })
  })

  it('returns null weekly percentage when the previous week is zero', async () => {
    const { user, accessToken } = await createDashboardUser()
    await createSession(user.id, {
      startedAt: utcDate(0, 8),
      completedAt: utcDate(0, 9),
    })

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.overview.weeklyProgress.percentageChange).toBeNull()
  })

  it('returns ordered 90-day body-weight points without interpolation', async () => {
    const { user, accessToken } = await createDashboardUser()
    await prisma.bodyMeasurement.createMany({
      data: [
        { userId: user.id, weightKg: '80.00', measuredAt: utcDate(-100) },
        { userId: user.id, weightKg: '78.00', measuredAt: utcDate(-4) },
        { userId: user.id, weightKg: '78.55', measuredAt: utcDate(-1) },
      ],
    })

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.bodyWeightProgress.points).toEqual([
      { date: '2026-08-01', weightKg: 78 },
      { date: '2026-08-04', weightKg: 78.55 },
    ])
    expect(body.data.bodyWeightProgress.trend.direction).toBe('INCREASING')
  })

  it('does not expose another user body or workout analytics', async () => {
    const owner = await createDashboardUser()
    const viewer = await createDashboardUser()
    await prisma.bodyMeasurement.create({
      data: {
        userId: owner.user.id,
        weightKg: '91.25',
        measuredAt: utcDate(0),
      },
    })
    await createSession(owner.user.id, {
      startedAt: utcDate(0, 8),
      completedAt: utcDate(0, 9),
    })

    const body = parseDashboard(await getDashboard(viewer.accessToken))
    expect(body.data.overview.currentBodyWeightKg).toBeNull()
    expect(body.data.overview.workoutsCompleted).toBe(0)
    expect(body.data.bodyWeightProgress.points).toEqual([])
  })

  it('clamps a negative historical workout duration in the response', async () => {
    const { user, accessToken } = await createDashboardUser()
    await createSession(user.id, {
      startedAt: new Date('2026-08-05T11:00:00.000Z'),
      completedAt: new Date('2026-08-05T10:00:00.000Z'),
    })

    const body = parseDashboard(await getDashboard(accessToken))
    expect(body.data.overview.lastWorkout?.durationMinutes).toBe(0)
  })
})
