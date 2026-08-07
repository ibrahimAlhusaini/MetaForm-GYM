import { beforeEach, describe, expect, it } from 'vitest'
import {
  cleanWorkoutPlanData,
  createPlanExercise,
  createPlanUser,
  createStoredPlan,
  planApi,
  responseBody,
  type PlanResponseBody,
} from './workout-plans-test.helpers.js'

beforeEach(cleanWorkoutPlanData)

describe('workout plan discovery', () => {
  it('requires authentication', async () => {
    expect((await planApi().get('/api/v1/workout-plans')).status).toBe(401)
  })

  it('lists own and public plans without leaking another private plan', async () => {
    const viewer = await createPlanUser()
    const other = await createPlanUser()
    await createStoredPlan({
      userId: viewer.user.id,
      name: 'workout-plan-test-Mine',
    })
    await createStoredPlan({
      userId: null,
      name: 'workout-plan-test-System',
      isPublic: true,
    })
    await createStoredPlan({
      userId: other.user.id,
      name: 'workout-plan-test-Hidden',
    })
    const response = await planApi(viewer.token).get('/api/v1/workout-plans')
    const body = responseBody<PlanResponseBody>(response)
    expect(response.status).toBe(200)
    expect(body.data.items.map((item) => item.name)).toEqual(
      expect.arrayContaining([
        'workout-plan-test-Mine',
        'workout-plan-test-System',
      ]),
    )
    expect(body.data.items.map((item) => item.name)).not.toContain(
      'workout-plan-test-Hidden',
    )
  })

  it('supports search, difficulty, ownership, template, pagination, and sorting', async () => {
    const viewer = await createPlanUser()
    await createStoredPlan({
      userId: viewer.user.id,
      name: 'workout-plan-test-Zulu Template',
      isTemplate: true,
    })
    await createStoredPlan({
      userId: viewer.user.id,
      name: 'workout-plan-test-Alpha Draft',
    })
    await createStoredPlan({
      userId: null,
      name: 'workout-plan-test-Public Template',
      isPublic: true,
      isTemplate: true,
    })

    const filtered = responseBody<PlanResponseBody>(
      await planApi(viewer.token).get(
        '/api/v1/workout-plans?search=template&difficultyLevel=INTERMEDIATE&isTemplate=true&ownership=mine&sortBy=name&sortOrder=asc&page=1&limit=1',
      ),
    )
    expect(filtered.data.items).toHaveLength(1)
    expect(filtered.data.items[0]?.name).toBe('workout-plan-test-Zulu Template')
    expect(filtered.data.pagination).toMatchObject({
      page: 1,
      limit: 1,
      totalItems: 1,
    })

    const publicOnly = responseBody<PlanResponseBody>(
      await planApi(viewer.token).get(
        '/api/v1/workout-plans?ownership=public&search=workout-plan-test-Public%20Template',
      ),
    )
    expect(publicOnly.data.items).toHaveLength(1)
    expect(publicOnly.data.items[0]?.ownershipType).toBe('SYSTEM')
  })

  it('returns system and user templates with explicit template types', async () => {
    const viewer = await createPlanUser()
    const other = await createPlanUser()
    await createStoredPlan({
      userId: null,
      isPublic: true,
      isTemplate: true,
      name: 'workout-plan-test-System Template',
    })
    await createStoredPlan({
      userId: viewer.user.id,
      isTemplate: true,
      name: 'workout-plan-test-User Template',
    })
    await createStoredPlan({
      userId: other.user.id,
      isTemplate: true,
      name: 'workout-plan-test-Hidden Template',
    })
    const body = responseBody<PlanResponseBody>(
      await planApi(viewer.token).get(
        '/api/v1/workout-plans/templates?limit=10',
      ),
    )
    expect(body.data.items.map((item) => item.templateType)).toEqual(
      expect.arrayContaining(['SYSTEM_TEMPLATE', 'USER_TEMPLATE']),
    )
    expect(body.data.items.map((item) => item.name)).not.toContain(
      'workout-plan-test-Hidden Template',
    )
  })

  it('returns ordered detail, exercise summaries, and structural statistics', async () => {
    const viewer = await createPlanUser()
    const exercise = await createPlanExercise()
    const plan = await createStoredPlan({
      userId: viewer.user.id,
      exerciseId: exercise.id,
    })
    const response = await planApi(viewer.token).get(
      `/api/v1/workout-plans/${plan.id}`,
    )
    const body = responseBody<PlanResponseBody>(response)
    expect(response.status).toBe(200)
    expect(body.data).toMatchObject({
      totalDays: 2,
      trainingDays: 1,
      restDays: 1,
      totalExercises: 2,
    })
    expect(body.data.days.map((day) => day.orderIndex)).toEqual([0, 1])
    expect(body.data.days[1]?.exercises.map((item) => item.orderIndex)).toEqual(
      [0, 1],
    )
    expect(body.data.days[1]?.exercises[0]?.exercise).toMatchObject({
      id: exercise.id,
      name: exercise.name,
    })
  })

  it('returns safe 404 for another user private detail and unpublished system detail', async () => {
    const viewer = await createPlanUser()
    const other = await createPlanUser()
    const privatePlan = await createStoredPlan({ userId: other.user.id })
    const draftSystem = await createStoredPlan({ userId: null })
    for (const planId of [privatePlan.id, draftSystem.id]) {
      const response = await planApi(viewer.token).get(
        `/api/v1/workout-plans/${planId}`,
      )
      expect(response.status).toBe(404)
      expect(response.text).not.toContain('Prisma')
    }
  })
})
