import { beforeEach, describe, expect, it } from 'vitest'
import { UserRole } from '../src/generated/prisma/client.js'
import { prisma } from '../src/config/prisma.js'
import {
  cleanWorkoutPlanData,
  createPlanExercise,
  createPlanUser,
  createStoredPlan,
  planApi,
  planPayload,
  responseBody,
  type PlanResponseBody,
} from './workout-plans-test.helpers.js'

beforeEach(cleanWorkoutPlanData)

describe('system workout plan administration', () => {
  it('returns 403 for normal users', async () => {
    const user = await createPlanUser()
    const exercise = await createPlanExercise()
    expect(
      (
        await planApi(user.token)
          .post('/api/v1/admin/workout-plans')
          .send({ ...planPayload(exercise.id), isPublic: false })
      ).status,
    ).toBe(403)
  })

  it('creates, patches, publishes, discovers, and unpublishes a system template', async () => {
    const admin = await createPlanUser(UserRole.ADMIN)
    const viewer = await createPlanUser()
    const exercise = await createPlanExercise()
    const createdResponse = await planApi(admin.token)
      .post('/api/v1/admin/workout-plans')
      .send({
        ...planPayload(exercise.id),
        name: 'workout-plan-test-Beginner System',
        isTemplate: true,
        isPublic: false,
      })
    const created = responseBody<PlanResponseBody>(createdResponse)
    expect(createdResponse.status).toBe(201)
    expect(created.data).toMatchObject({
      ownershipType: 'SYSTEM',
      isPublic: false,
      templateType: 'SYSTEM_TEMPLATE',
    })
    expect(
      (
        await planApi(viewer.token).get(
          `/api/v1/workout-plans/${created.data.id}`,
        )
      ).status,
    ).toBe(404)
    expect(
      (
        await planApi(admin.token)
          .patch(`/api/v1/admin/workout-plans/${created.data.id}`)
          .send({ difficultyLevel: 'BEGINNER' })
      ).status,
    ).toBe(200)
    expect(
      (
        await planApi(admin.token)
          .post(`/api/v1/admin/workout-plans/${created.data.id}/publish`)
          .send()
      ).status,
    ).toBe(200)
    expect(
      (
        await planApi(viewer.token).get(
          `/api/v1/workout-plans/${created.data.id}`,
        )
      ).status,
    ).toBe(200)
    expect(
      (
        await planApi(admin.token)
          .post(`/api/v1/admin/workout-plans/${created.data.id}/unpublish`)
          .send()
      ).status,
    ).toBe(200)
    expect(
      (
        await planApi(viewer.token).get(
          `/api/v1/workout-plans/${created.data.id}`,
        )
      ).status,
    ).toBe(404)
  })

  it('rejects publication of an invalid or exercise-stale plan', async () => {
    const admin = await createPlanUser(UserRole.ADMIN)
    const empty = await createStoredPlan({ userId: null })
    expect(
      (
        await planApi(admin.token)
          .post(`/api/v1/admin/workout-plans/${empty.id}/publish`)
          .send()
      ).status,
    ).toBe(409)
    const exercise = await createPlanExercise()
    const stale = await createStoredPlan({
      userId: null,
      exerciseId: exercise.id,
    })
    await prisma.exercise.update({
      where: { id: exercise.id },
      data: { isPublished: false },
    })
    expect(
      (
        await planApi(admin.token)
          .post(`/api/v1/admin/workout-plans/${stale.id}/publish`)
          .send()
      ).status,
    ).toBe(409)
  })

  it('prevents normal deletion and preserves session history during admin deletion', async () => {
    const admin = await createPlanUser(UserRole.ADMIN)
    const user = await createPlanUser()
    const system = await createStoredPlan({ userId: null, isPublic: true })
    const session = await prisma.workoutSession.create({
      data: { userId: user.user.id, workoutPlanId: system.id },
    })
    expect(
      (await planApi(user.token).delete(`/api/v1/workout-plans/${system.id}`))
        .status,
    ).toBe(404)
    expect(
      (
        await planApi(admin.token).delete(
          `/api/v1/admin/workout-plans/${system.id}`,
        )
      ).status,
    ).toBe(200)
    expect(
      (await prisma.workoutSession.findUnique({ where: { id: session.id } }))
        ?.workoutPlanId,
    ).toBeNull()
  })

  it('does not let admin system routes mutate or delete a user-owned plan', async () => {
    const admin = await createPlanUser(UserRole.ADMIN)
    const owner = await createPlanUser()
    const plan = await createStoredPlan({ userId: owner.user.id })
    expect(
      (
        await planApi(admin.token)
          .patch(`/api/v1/admin/workout-plans/${plan.id}`)
          .send({ name: 'Blocked' })
      ).status,
    ).toBe(404)
    expect(
      (
        await planApi(admin.token).delete(
          `/api/v1/admin/workout-plans/${plan.id}`,
        )
      ).status,
    ).toBe(404)
  })
})

describe('Weight Tracker workout plan compatibility', () => {
  it('accepts owned and public plans but rejects private cross-user and system drafts', async () => {
    const owner = await createPlanUser()
    const other = await createPlanUser()
    const own = await createStoredPlan({ userId: owner.user.id })
    const publicSystem = await createStoredPlan({
      userId: null,
      isPublic: true,
    })
    const otherPrivate = await createStoredPlan({ userId: other.user.id })
    const systemDraft = await createStoredPlan({ userId: null })
    for (const workoutPlanId of [own.id, publicSystem.id]) {
      expect(
        (
          await planApi(owner.token)
            .post('/api/v1/weight-tracker/sessions')
            .send({ workoutPlanId })
        ).status,
      ).toBe(201)
    }
    for (const workoutPlanId of [otherPrivate.id, systemDraft.id]) {
      expect(
        (
          await planApi(owner.token)
            .post('/api/v1/weight-tracker/sessions')
            .send({ workoutPlanId })
        ).status,
      ).toBe(404)
    }
  })
})
