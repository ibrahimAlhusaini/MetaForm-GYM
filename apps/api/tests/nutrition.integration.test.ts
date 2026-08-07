import type { DashboardSummaryResponse } from '@metaform/shared-types'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '../src/config/prisma.js'
import {
  cleanNutritionTestData,
  createNutritionUser,
  createStoredCalculation,
  explicitNutritionInput,
  nutritionApi,
  parseCalculation,
  parseHistory,
  parseLatest,
  parseProfileInputs,
} from './nutrition-test.helpers.js'

beforeEach(cleanNutritionTestData)
afterAll(cleanNutritionTestData)

describe('nutrition API', () => {
  it('protects every nutrition endpoint', async () => {
    for (const response of await Promise.all([
      nutritionApi().post('/api/v1/nutrition/calculate').send({}),
      nutritionApi().get('/api/v1/nutrition/latest'),
      nutritionApi().get('/api/v1/nutrition/history'),
      nutritionApi().get('/api/v1/nutrition/profile-inputs'),
    ]))
      expect(response.status).toBe(401)
  })

  it('calculates, serializes, versions, and persists explicit inputs', async () => {
    const { user, token } = await createNutritionUser()
    const response = await nutritionApi(token)
      .post('/api/v1/nutrition/calculate')
      .send(explicitNutritionInput)
    expect(response.status).toBe(201)
    const body = parseCalculation(response)
    expect(body.data.inputs.sources).toEqual({
      age: 'REQUEST',
      gender: 'REQUEST',
      heightCm: 'REQUEST',
      weightKg: 'REQUEST',
      activityLevel: 'REQUEST',
      goal: 'REQUEST',
    })
    expect(body.data.results).toMatchObject({
      bmi: 25.88,
      proteinGrams: 164,
      waterLiters: 2.87,
      safetyFloorApplied: false,
    })
    expect(typeof body.data.results.maintenanceCalories).toBe('number')
    expect(body.data.methodology.calculationVersion).toBe('1.0')
    expect(body.data.disclaimer).toContain('not medical advice')
    const stored = await prisma.nutritionCalculation.findUniqueOrThrow({
      where: { id: body.data.calculationId },
    })
    expect(stored.userId).toBe(user.id)
    expect(stored.calculationVersion).toBe('1.0')
    expect(stored.bmiCategory).toBe('OVERWEIGHT')
  })

  it('uses complete profile fallback and returns minimal profile inputs', async () => {
    const { token } = await createNutritionUser(true)
    const profileResponse = await nutritionApi(token).get(
      '/api/v1/nutrition/profile-inputs',
    )
    expect(parseProfileInputs(profileResponse).data).toMatchObject({
      age: 28,
      weightKg: 82,
      completeness: {
        age: true,
        gender: true,
        heightCm: true,
        weightKg: true,
        activityLevel: true,
        goal: true,
      },
    })
    const response = await nutritionApi(token)
      .post('/api/v1/nutrition/calculate')
      .send({})
    expect(response.status).toBe(201)
    expect(parseCalculation(response).data.inputs.sources).toEqual({
      age: 'PROFILE',
      gender: 'PROFILE',
      heightCm: 'PROFILE',
      weightKg: 'PROFILE',
      activityLevel: 'PROFILE',
      goal: 'PROFILE',
    })
  })

  it('lets request values override profile without mutating it', async () => {
    const { user, token } = await createNutritionUser(true)
    const before = await prisma.profile.findUniqueOrThrow({
      where: { userId: user.id },
    })
    const response = await nutritionApi(token)
      .post('/api/v1/nutrition/calculate')
      .send({ weightKg: 90 })
    const body = parseCalculation(response)
    expect(body.data.inputs.weightKg).toBe(90)
    expect(body.data.inputs.sources.weightKg).toBe('REQUEST')
    expect(body.data.inputs.sources.heightCm).toBe('PROFILE')
    const after = await prisma.profile.findUniqueOrThrow({
      where: { userId: user.id },
    })
    expect(after.currentWeightKg?.toString()).toBe(
      before.currentWeightKg?.toString(),
    )
    expect(after.updatedAt).toEqual(before.updatedAt)
  })

  it('returns field-specific missing and unsupported input details', async () => {
    const { token } = await createNutritionUser()
    const missing = await nutritionApi(token)
      .post('/api/v1/nutrition/calculate')
      .send({ age: 28 })
    expect(missing.status).toBe(400)
    expect(JSON.parse(missing.text) as unknown).toMatchObject({
      message: 'Additional information is required',
      details: {
        missingFields: [
          'gender',
          'heightCm',
          'weightKg',
          'activityLevel',
          'goal',
        ],
      },
    })
    const unsupported = await nutritionApi(token)
      .post('/api/v1/nutrition/calculate')
      .send({ ...explicitNutritionInput, gender: 'PREFER_NOT_TO_SAY' })
    expect(unsupported.status).toBe(400)
    expect(JSON.parse(unsupported.text) as unknown).toMatchObject({
      message: 'Nutrition inputs are not supported',
      details: { invalidFields: ['gender'] },
    })
  })

  it('returns null latest when absent and the newest scoped record otherwise', async () => {
    const first = await createNutritionUser()
    const second = await createNutritionUser()
    expect(
      parseLatest(
        await nutritionApi(first.token).get('/api/v1/nutrition/latest'),
      ).data,
    ).toBeNull()
    await createStoredCalculation(
      first.user.id,
      new Date('2026-07-01T00:00:00.000Z'),
      2200,
    )
    await createStoredCalculation(
      first.user.id,
      new Date('2026-07-02T00:00:00.000Z'),
      2300,
    )
    await createStoredCalculation(
      second.user.id,
      new Date('2026-07-03T00:00:00.000Z'),
      9999,
    )
    const latest = parseLatest(
      await nutritionApi(first.token).get('/api/v1/nutrition/latest'),
    ).data
    expect(latest?.results.maintenanceCalories).toBe(2300)
  })

  it('paginates, filters, sorts, and scopes history', async () => {
    const owner = await createNutritionUser()
    const other = await createNutritionUser()
    for (const [date, calories] of [
      ['2026-07-01T00:00:00.000Z', 2100],
      ['2026-07-02T00:00:00.000Z', 2200],
      ['2026-07-03T00:00:00.000Z', 2300],
    ] as const)
      await createStoredCalculation(owner.user.id, new Date(date), calories)
    await createStoredCalculation(
      other.user.id,
      new Date('2026-07-02T00:00:00.000Z'),
      9999,
    )
    const response = await nutritionApi(owner.token).get(
      '/api/v1/nutrition/history?page=1&limit=1&sortOrder=asc&dateFrom=2026-07-02T00:00:00.000Z&dateTo=2026-07-03T00:00:00.000Z',
    )
    const history = parseHistory(response).data
    expect(history.pagination).toMatchObject({
      page: 1,
      limit: 1,
      totalItems: 2,
      totalPages: 2,
      hasNextPage: true,
    })
    expect(history.items[0]?.results.maintenanceCalories).toBe(2200)
    expect(
      history.items.some((item) => item.results.maintenanceCalories === 9999),
    ).toBe(false)
  })

  it('keeps Dashboard daily calories compatible with the newest calculation', async () => {
    const { token } = await createNutritionUser()
    const calculation = parseCalculation(
      await nutritionApi(token)
        .post('/api/v1/nutrition/calculate')
        .send(explicitNutritionInput),
    )
    const dashboard = await nutritionApi(token).get('/api/v1/dashboard/summary')
    const dashboardBody = JSON.parse(dashboard.text) as DashboardSummaryResponse
    expect(dashboardBody.data.overview.dailyCalories).toBe(
      calculation.data.results.maintenanceCalories,
    )
  })

  it('rejects invalid ranges, enums, chronology, and unbounded limits', async () => {
    const { token } = await createNutritionUser()
    for (const response of await Promise.all([
      nutritionApi(token)
        .post('/api/v1/nutrition/calculate')
        .send({ ...explicitNutritionInput, heightCm: 0 }),
      nutritionApi(token)
        .post('/api/v1/nutrition/calculate')
        .send({ ...explicitNutritionInput, goal: 'UNKNOWN' }),
      nutritionApi(token).get('/api/v1/nutrition/history?limit=101'),
      nutritionApi(token).get(
        '/api/v1/nutrition/history?dateFrom=2026-08-02T00:00:00.000Z&dateTo=2026-08-01T00:00:00.000Z',
      ),
    ]))
      expect(response.status).toBe(400)
  })

  it('maps legacy nullable context without Decimal leakage', async () => {
    const { user, token } = await createNutritionUser()
    await createStoredCalculation(user.id, new Date(), 2400)
    const item = parseLatest(
      await nutritionApi(token).get('/api/v1/nutrition/latest'),
    ).data
    expect(item?.inputs).toBeNull()
    expect(item?.methodology).toBeNull()
    expect(item?.results.recommendedCalories).toBeNull()
    expect(typeof item?.results.bmi).toBe('number')
  })

  it('persists and returns the calorie safety-floor decision', async () => {
    const { token } = await createNutritionUser()
    const response = await nutritionApi(token)
      .post('/api/v1/nutrition/calculate')
      .send({
        age: 100,
        gender: 'MALE',
        heightCm: 100,
        weightKg: 30,
        activityLevel: 'SEDENTARY',
        goal: 'LOSE_FAT',
      })
    const calculation = parseCalculation(response).data
    expect(calculation.results.cuttingCalories).toBe(1500)
    expect(calculation.results.safetyFloorApplied).toBe(true)
    const latest = parseLatest(
      await nutritionApi(token).get('/api/v1/nutrition/latest'),
    ).data
    expect(latest?.results.safetyFloorApplied).toBe(true)
  })

  it('hides unexpected persistence errors', async () => {
    const { token } = await createNutritionUser()
    const spy = vi
      .spyOn(prisma.nutritionCalculation, 'create')
      .mockRejectedValueOnce(new Error('private database details'))
    const response = await nutritionApi(token)
      .post('/api/v1/nutrition/calculate')
      .send(explicitNutritionInput)
    spy.mockRestore()
    expect(response.status).toBe(500)
    expect(JSON.parse(response.text) as unknown).toEqual({
      success: false,
      message: 'Internal server error',
    })
    expect(response.text).not.toContain('private database details')
  })
})
