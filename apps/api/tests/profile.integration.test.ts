import type {
  DashboardSummaryResponse,
  NutritionProfileInputsResponse,
} from '@metaform/shared-types'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '../src/config/prisma.js'
import {
  birthDateForAge,
  cleanProfileTestData,
  createProfileUser,
  parseCompleteness,
  parseProfile,
  parseProfileUpdate,
  parseSummary,
  profileApi,
} from './profile-test.helpers.js'

beforeEach(cleanProfileTestData)
afterAll(cleanProfileTestData)

const completeUpdate = () => ({
  fullName: 'Updated Member',
  birthDate: birthDateForAge(28),
  gender: 'MALE',
  heightCm: 178,
  currentWeightKg: 82,
  activityLevel: 'MODERATE',
  fitnessGoal: 'BUILD_MUSCLE',
})

describe('profile API authentication and privacy', () => {
  it('protects every endpoint', async () => {
    const responses = await Promise.all([
      profileApi().get('/api/v1/profile'),
      profileApi().patch('/api/v1/profile').send({ fullName: 'Member' }),
      profileApi().get('/api/v1/profile/completeness'),
      profileApi().get('/api/v1/profile/summary'),
    ])
    responses.forEach((response) => {
      expect(response.status).toBe(401)
    })
  })

  it('scopes reads and writes to the authenticated user', async () => {
    const owner = await createProfileUser()
    const other = await createProfileUser()
    await profileApi(owner.token)
      .patch('/api/v1/profile')
      .send({ fullName: 'Owner Name', currentWeightKg: 91 })
    const otherProfile = parseProfile(
      await profileApi(other.token).get('/api/v1/profile'),
    ).data
    expect(otherProfile.fullName).toBe('Profile Tester')
    expect(otherProfile.currentWeightKg).toBeNull()
    const ownerRow = await prisma.profile.findUniqueOrThrow({
      where: { userId: owner.user.id },
    })
    expect(ownerRow.fullName).toBe('Owner Name')
  })

  it('rejects mass assignment and never exposes auth or server fields', async () => {
    const { user, token } = await createProfileUser()
    const response = await profileApi(token)
      .patch('/api/v1/profile')
      .send({ userId: user.id, fullName: 'Injected' })
    expect(response.status).toBe(400)
    const detailResponse = await profileApi(token).get('/api/v1/profile')
    expect(detailResponse.text).not.toContain(user.email)
    expect(detailResponse.text).not.toContain('passwordHash')
    expect(detailResponse.text).not.toContain('userId')
    expect(detailResponse.text).not.toContain('createdAt')
  })
})

describe('profile initialization and PATCH semantics', () => {
  it('returns a stable empty contract for a missing profile', async () => {
    const { user, token } = await createProfileUser(false)
    const detail = parseProfile(
      await profileApi(token).get('/api/v1/profile'),
    ).data
    expect(detail).toEqual({
      initialized: false,
      fullName: null,
      birthDate: null,
      gender: null,
      heightCm: null,
      currentWeightKg: null,
      activityLevel: null,
      fitnessGoal: null,
    })
    expect(await prisma.profile.count({ where: { userId: user.id } })).toBe(0)
  })

  it('initializes through upsert once a full name is provided', async () => {
    const { user, token } = await createProfileUser(false)
    const first = await profileApi(token)
      .patch('/api/v1/profile')
      .send({ fullName: '  New Member  ', heightCm: 172 })
    const second = await profileApi(token)
      .patch('/api/v1/profile')
      .send({ currentWeightKg: 70 })
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(parseProfileUpdate(second).data).toMatchObject({
      initialized: true,
      fullName: 'New Member',
      heightCm: 172,
      currentWeightKg: 70,
    })
    expect(await prisma.profile.count({ where: { userId: user.id } })).toBe(1)
  })

  it('requires a name when initializing a missing row', async () => {
    const { token } = await createProfileUser(false)
    const response = await profileApi(token)
      .patch('/api/v1/profile')
      .send({ heightCm: 175 })
    expect(response.status).toBe(400)
    expect(JSON.parse(response.text) as unknown).toMatchObject({
      message: 'Full name is required to initialize the profile',
      details: { missingFields: ['fullName'] },
    })
  })

  it('updates one or many fields while preserving omitted values', async () => {
    const { token } = await createProfileUser()
    await profileApi(token).patch('/api/v1/profile').send(completeUpdate())
    const response = await profileApi(token)
      .patch('/api/v1/profile')
      .send({ heightCm: 180, fitnessGoal: 'IMPROVE_STRENGTH' })
    expect(parseProfileUpdate(response).data).toMatchObject({
      fullName: 'Updated Member',
      heightCm: 180,
      currentWeightKg: 82,
      fitnessGoal: 'IMPROVE_STRENGTH',
      activityLevel: 'MODERATE',
    })
  })

  it('clears nullable fields explicitly and rejects empty or null names', async () => {
    const { token } = await createProfileUser()
    await profileApi(token).patch('/api/v1/profile').send(completeUpdate())
    const cleared = await profileApi(token)
      .patch('/api/v1/profile')
      .send({ birthDate: null, gender: null, currentWeightKg: null })
    expect(parseProfileUpdate(cleared).data).toMatchObject({
      birthDate: null,
      gender: null,
      currentWeightKg: null,
    })
    expect(
      (await profileApi(token).patch('/api/v1/profile').send({ fullName: '' }))
        .status,
    ).toBe(400)
    expect(
      (
        await profileApi(token)
          .patch('/api/v1/profile')
          .send({ fullName: null })
      ).status,
    ).toBe(400)
  })

  it('rejects invalid enums, measurements, empty patches, and bad dates', async () => {
    const { token } = await createProfileUser()
    const invalidBodies = [
      {},
      { gender: 'UNKNOWN' },
      { activityLevel: 'UNKNOWN' },
      { fitnessGoal: 'UNKNOWN' },
      { heightCm: 99 },
      { heightCm: 250.001 },
      { currentWeightKg: 29 },
      { currentWeightKg: 351 },
      { birthDate: 'not-a-date' },
      { birthDate: '2025-02-29' },
      { birthDate: '2999-01-01' },
      { birthDate: birthDateForAge(13) },
      { birthDate: birthDateForAge(101) },
    ]
    for (const body of invalidBodies) {
      const response = await profileApi(token)
        .patch('/api/v1/profile')
        .send(body)
      expect(response.status).toBe(400)
      expect(response.text).not.toContain('Zod')
    }
  })
})

describe('profile completeness and summary', () => {
  it('returns deterministic empty, partial, and full completeness', async () => {
    const missing = await createProfileUser(false)
    expect(
      parseCompleteness(
        await profileApi(missing.token).get('/api/v1/profile/completeness'),
      ).data,
    ).toMatchObject({ percentage: 0, complete: false })

    const partial = await createProfileUser()
    const partialResult = parseCompleteness(
      await profileApi(partial.token).get('/api/v1/profile/completeness'),
    ).data
    expect(partialResult.percentage).toBe(14)
    expect(partialResult.missingFields).not.toContain('fullName')

    await profileApi(partial.token)
      .patch('/api/v1/profile')
      .send(completeUpdate())
    const complete = parseCompleteness(
      await profileApi(partial.token).get('/api/v1/profile/completeness'),
    ).data
    expect(complete).toMatchObject({ percentage: 100, complete: true })
    expect(complete.missingFields).toEqual([])
  })

  it('returns compact summary with UTC age and no unnecessary data', async () => {
    const { user, token } = await createProfileUser()
    await profileApi(token).patch('/api/v1/profile').send(completeUpdate())
    const response = await profileApi(token).get('/api/v1/profile/summary')
    const summary = parseSummary(response).data
    expect(summary).toMatchObject({
      displayName: 'Updated Member',
      age: 28,
      gender: 'MALE',
      heightCm: 178,
      currentWeightKg: 82,
      activityLevel: 'MODERATE',
      fitnessGoal: 'BUILD_MUSCLE',
      completeness: { percentage: 100, complete: true },
    })
    expect(response.text).not.toContain(user.email)
    expect(response.text).not.toContain('birthDate')
    expect(response.text).not.toContain('initialized')
  })

  it('returns null display name and age for a missing profile', async () => {
    const { token } = await createProfileUser(false)
    expect(
      parseSummary(await profileApi(token).get('/api/v1/profile/summary')).data,
    ).toMatchObject({ displayName: null, age: null })
  })
})

describe('profile domain compatibility', () => {
  it('updates only the weight snapshot and creates no measurement', async () => {
    const { user, token } = await createProfileUser()
    await profileApi(token)
      .patch('/api/v1/profile')
      .send({ currentWeightKg: 84.25 })
    expect(
      await prisma.bodyMeasurement.count({ where: { userId: user.id } }),
    ).toBe(0)
  })

  it('feeds updated values to Nutrition profile inputs', async () => {
    const { token } = await createProfileUser()
    await profileApi(token).patch('/api/v1/profile').send(completeUpdate())
    const response = await profileApi(token).get(
      '/api/v1/nutrition/profile-inputs',
    )
    const body = JSON.parse(response.text) as NutritionProfileInputsResponse
    expect(body.data).toMatchObject({
      age: 28,
      gender: 'MALE',
      heightCm: 178,
      weightKg: 82,
      activityLevel: 'MODERATE',
      goal: 'BUILD_MUSCLE',
    })
  })

  it('preserves Dashboard measurement-first and snapshot-fallback behavior', async () => {
    const { user, token } = await createProfileUser()
    await profileApi(token)
      .patch('/api/v1/profile')
      .send({ currentWeightKg: 84.25 })
    const fallbackResponse = await profileApi(token).get(
      '/api/v1/dashboard/summary',
    )
    const fallback = JSON.parse(
      fallbackResponse.text,
    ) as DashboardSummaryResponse
    expect(fallback.data.overview.currentBodyWeightKg).toBe(84.25)

    await prisma.bodyMeasurement.create({
      data: { userId: user.id, weightKg: 79.5 },
    })
    const measuredResponse = await profileApi(token).get(
      '/api/v1/dashboard/summary',
    )
    const measured = JSON.parse(
      measuredResponse.text,
    ) as DashboardSummaryResponse
    expect(measured.data.overview.currentBodyWeightKg).toBe(79.5)
  })

  it('hides unexpected database errors', async () => {
    const { token } = await createProfileUser()
    const spy = vi
      .spyOn(prisma.profile, 'findUnique')
      .mockRejectedValueOnce(new Error('private prisma details'))
    const response = await profileApi(token).get('/api/v1/profile')
    spy.mockRestore()
    expect(response.status).toBe(500)
    expect(JSON.parse(response.text) as unknown).toEqual({
      success: false,
      message: 'Internal server error',
    })
    expect(response.text).not.toContain('private prisma details')
  })
})
