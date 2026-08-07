import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
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

describe('workout plan aggregate mutations', () => {
  it('creates nested days and exercises atomically as a private user plan', async () => {
    const owner = await createPlanUser()
    const exercise = await createPlanExercise()
    const response = await planApi(owner.token)
      .post('/api/v1/workout-plans')
      .send(planPayload(exercise.id))
    const body = responseBody<PlanResponseBody>(response)
    expect(response.status).toBe(201)
    expect(body.data).toMatchObject({
      isPublic: false,
      ownershipType: 'USER',
      totalDays: 2,
      totalExercises: 1,
    })
    expect(body.data.days[0]?.exercises[0]).toMatchObject({
      sets: 4,
      orderIndex: 0,
    })
    expect(
      (await prisma.workoutPlan.findUnique({ where: { id: body.data.id } }))
        ?.userId,
    ).toBe(owner.user.id)
  })

  it('rolls back invalid or unpublished exercise references', async () => {
    const owner = await createPlanUser()
    const unpublished = await createPlanExercise('Draft exercise', false)
    for (const exerciseId of [randomUUID(), unpublished.id]) {
      const response = await planApi(owner.token)
        .post('/api/v1/workout-plans')
        .send(planPayload(exerciseId))
      expect(response.status).toBe(404)
    }
    expect(
      await prisma.workoutPlan.count({ where: { userId: owner.user.id } }),
    ).toBe(0)
  })

  it.each([
    [
      'duplicate day',
      (payload: ReturnType<typeof planPayload>) => ({
        ...payload,
        days: [payload.days[0], { ...payload.days[1], dayOfWeek: 'MONDAY' }],
      }),
    ],
    [
      'duplicate day order',
      (payload: ReturnType<typeof planPayload>) => ({
        ...payload,
        days: [payload.days[0], { ...payload.days[1], orderIndex: 0 }],
      }),
    ],
    [
      'rest day exercises',
      (payload: ReturnType<typeof planPayload>) => ({
        ...payload,
        days: [{ ...payload.days[0], isRestDay: true }],
      }),
    ],
    [
      'duplicate exercise order',
      (payload: ReturnType<typeof planPayload>) => {
        const day = payload.days[0]
        const exercise = day?.exercises[0]
        if (!day || !exercise) throw new Error('Expected nested payload')
        return {
          ...payload,
          days: [
            {
              ...day,
              exercises: [...day.exercises, { ...exercise }],
            },
          ],
        }
      },
    ],
  ])('rejects %s invariants', async (_label, mutate) => {
    const owner = await createPlanUser()
    const exercise = await createPlanExercise()
    const response = await planApi(owner.token)
      .post('/api/v1/workout-plans')
      .send(mutate(planPayload(exercise.id)))
    expect(response.status).toBe(400)
    expect(
      await prisma.workoutPlan.count({ where: { userId: owner.user.id } }),
    ).toBe(0)
  })

  it('rejects system ownership and public mass assignment', async () => {
    const owner = await createPlanUser()
    const exercise = await createPlanExercise()
    for (const extra of [{ userId: null }, { isPublic: true }]) {
      const response = await planApi(owner.token)
        .post('/api/v1/workout-plans')
        .send({ ...planPayload(exercise.id), ...extra })
      expect(response.status).toBe(400)
    }
  })

  it('lets only the owner update and delete while preserving session history', async () => {
    const owner = await createPlanUser()
    const other = await createPlanUser()
    const plan = await createStoredPlan({ userId: owner.user.id })
    const session = await prisma.workoutSession.create({
      data: { userId: owner.user.id, workoutPlanId: plan.id },
    })
    expect(
      (
        await planApi(other.token)
          .patch(`/api/v1/workout-plans/${plan.id}`)
          .send({ name: 'Blocked' })
      ).status,
    ).toBe(404)
    const updated = await planApi(owner.token)
      .patch(`/api/v1/workout-plans/${plan.id}`)
      .send({ name: 'workout-plan-test-Updated', isTemplate: true })
    expect(updated.status).toBe(200)
    expect(
      (await planApi(other.token).delete(`/api/v1/workout-plans/${plan.id}`))
        .status,
    ).toBe(404)
    expect(
      (await planApi(owner.token).delete(`/api/v1/workout-plans/${plan.id}`))
        .status,
    ).toBe(200)
    expect(
      (await prisma.workoutSession.findUnique({ where: { id: session.id } }))
        ?.workoutPlanId,
    ).toBeNull()
  })

  it('clones public system and owned plans with deterministic private ownership and new IDs', async () => {
    const owner = await createPlanUser()
    const exercise = await createPlanExercise()
    const system = await createStoredPlan({
      userId: null,
      exerciseId: exercise.id,
      isPublic: true,
      isTemplate: true,
    })
    const own = await createStoredPlan({
      userId: owner.user.id,
      exerciseId: exercise.id,
    })
    for (const source of [system, own]) {
      const response = await planApi(owner.token)
        .post(`/api/v1/workout-plans/${source.id}/clone`)
        .send({ name: `workout-plan-test-Copy ${source.id}` })
      const body = responseBody<PlanResponseBody>(response)
      expect(response.status).toBe(201)
      expect(body.data).toMatchObject({
        isPublic: false,
        isTemplate: false,
        ownershipType: 'USER',
      })
      expect(body.data.id).not.toBe(source.id)
      expect(body.data.days[0]?.id).not.toBe(source.days[0]?.id)
      expect(body.data.days[1]?.exercises[0]?.id).not.toBe(
        source.days[1]?.exercises[0]?.id,
      )
    }
  })

  it('cannot clone another user private plan', async () => {
    const viewer = await createPlanUser()
    const other = await createPlanUser()
    const plan = await createStoredPlan({ userId: other.user.id })
    expect(
      (
        await planApi(viewer.token)
          .post(`/api/v1/workout-plans/${plan.id}/clone`)
          .send({})
      ).status,
    ).toBe(404)
  })
})

describe('workout plan child mutations and ordering', () => {
  it('adds, updates, rejects populated-rest conversion, reorders, and deletes days', async () => {
    const owner = await createPlanUser()
    const exercise = await createPlanExercise()
    const plan = await createStoredPlan({
      userId: owner.user.id,
      exerciseId: exercise.id,
    })
    const added = responseBody<PlanResponseBody>(
      await planApi(owner.token)
        .post(`/api/v1/workout-plans/${plan.id}/days`)
        .send({
          dayOfWeek: 'WEDNESDAY',
          name: 'New day',
          isRestDay: false,
          orderIndex: 2,
        }),
    )
    const dayId = added.data.days.find(
      (day) => day.dayOfWeek === 'WEDNESDAY',
    )?.id
    const populatedDay = plan.days.find((day) => !day.isRestDay)
    const [firstOriginalDay, secondOriginalDay] = plan.days
    if (!dayId || !populatedDay || !firstOriginalDay || !secondOriginalDay)
      throw new Error('Expected three plan days after creation')
    expect(
      (
        await planApi(owner.token)
          .patch(`/api/v1/workout-plans/days/${dayId}`)
          .send({ name: 'Updated day' })
      ).status,
    ).toBe(200)
    expect(
      (
        await planApi(owner.token)
          .patch(`/api/v1/workout-plans/days/${populatedDay.id}`)
          .send({ isRestDay: true })
      ).status,
    ).toBe(409)
    expect(
      (
        await planApi(owner.token)
          .post(`/api/v1/workout-plans/${plan.id}/days/reorder`)
          .send({ items: [{ dayId: populatedDay.id, orderIndex: 0 }] })
      ).status,
    ).toBe(400)
    const reorder = await planApi(owner.token)
      .post(`/api/v1/workout-plans/${plan.id}/days/reorder`)
      .send({
        items: [
          { dayId, orderIndex: 0 },
          { dayId: firstOriginalDay.id, orderIndex: 1 },
          { dayId: secondOriginalDay.id, orderIndex: 2 },
        ],
      })
    expect(reorder.status).toBe(200)
    expect(
      (await planApi(owner.token).delete(`/api/v1/workout-plans/days/${dayId}`))
        .status,
    ).toBe(200)
  })

  it('adds, updates, reorders, and deletes published planned exercises', async () => {
    const owner = await createPlanUser()
    const first = await createPlanExercise('First')
    const second = await createPlanExercise('Second')
    const plan = await createStoredPlan({
      userId: owner.user.id,
      exerciseId: first.id,
    })
    const trainingDay = plan.days.find((day) => !day.isRestDay)
    if (!trainingDay) throw new Error('Expected training day')
    const added = responseBody<PlanResponseBody>(
      await planApi(owner.token)
        .post(`/api/v1/workout-plans/days/${trainingDay.id}/exercises`)
        .send({
          exerciseId: second.id,
          sets: 5,
          reps: '5',
          restSeconds: 180,
          orderIndex: 2,
        }),
    )
    const addedItem = added.data.days
      .find((day) => day.id === trainingDay.id)
      ?.exercises.find((item) => item.exercise.id === second.id)
    if (!addedItem) throw new Error('Expected added exercise')
    expect(
      (
        await planApi(owner.token)
          .patch(`/api/v1/workout-plans/exercises/${addedItem.id}`)
          .send({ exerciseId: first.id, sets: 6, notes: 'Updated' })
      ).status,
    ).toBe(200)
    const allIds = [
      ...trainingDay.exercises.map((item) => item.id),
      addedItem.id,
    ]
    const reordered = await planApi(owner.token)
      .post(`/api/v1/workout-plans/days/${trainingDay.id}/exercises/reorder`)
      .send({
        items: allIds.map((planExerciseId, index) => ({
          planExerciseId,
          orderIndex: allIds.length - index - 1,
        })),
      })
    expect(reordered.status).toBe(200)
    expect(
      (
        await planApi(owner.token).delete(
          `/api/v1/workout-plans/exercises/${addedItem.id}`,
        )
      ).status,
    ).toBe(200)
  })

  it('rejects rest-day, unpublished, and cross-owner exercise mutations', async () => {
    const owner = await createPlanUser()
    const other = await createPlanUser()
    const published = await createPlanExercise()
    const unpublished = await createPlanExercise('Unpublished', false)
    const plan = await createStoredPlan({
      userId: owner.user.id,
      exerciseId: published.id,
    })
    const restDay = plan.days.find((day) => day.isRestDay)
    const trainingDay = plan.days.find((day) => !day.isRestDay)
    if (!restDay || !trainingDay) throw new Error('Expected plan days')
    const ownedItem = trainingDay.exercises[0]
    if (!ownedItem) throw new Error('Expected planned exercise')
    expect(
      (
        await planApi(owner.token)
          .post(`/api/v1/workout-plans/days/${restDay.id}/exercises`)
          .send({ exerciseId: published.id, orderIndex: 0 })
      ).status,
    ).toBe(409)
    expect(
      (
        await planApi(owner.token)
          .post(`/api/v1/workout-plans/days/${trainingDay.id}/exercises`)
          .send({ exerciseId: unpublished.id, orderIndex: 2 })
      ).status,
    ).toBe(404)
    expect(
      (
        await planApi(owner.token)
          .patch(`/api/v1/workout-plans/exercises/${ownedItem.id}`)
          .send({ exerciseId: unpublished.id })
      ).status,
    ).toBe(404)
    expect(
      (
        await planApi(other.token).delete(
          `/api/v1/workout-plans/exercises/${ownedItem.id}`,
        )
      ).status,
    ).toBe(404)
  })
})
