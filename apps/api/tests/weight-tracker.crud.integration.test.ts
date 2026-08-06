import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/config/prisma.js'
import {
  api,
  cleanWeightTrackerData,
  createExercise,
  createLogViaApi,
  createMachineViaApi,
  createSessionViaApi,
  createSetViaApi,
  createUser,
  machinePayload,
  parseTrackerResponse,
  setPayload,
} from './weight-tracker-test.helpers.js'

beforeEach(cleanWeightTrackerData)
afterAll(async () => {
  await cleanWeightTrackerData()
  await prisma.$disconnect()
})

describe('weight tracker machine API', () => {
  it('creates, lists, searches, filters, sorts, and updates an owned machine', async () => {
    const { token } = await createUser()
    const created = await api(token)
      .post('/api/v1/weight-tracker/machines')
      .send(machinePayload)
    expect(created.status).toBe(201)
    const createdBody = parseTrackerResponse(created)
    expect(createdBody.data.machine).toMatchObject({
      name: machinePayload.name,
      imageUrl: null,
    })
    const listed = await api(token).get(
      '/api/v1/weight-tracker/machines?search=press&targetMuscle=CHEST&sortBy=name&sortOrder=asc',
    )
    const listedBody = parseTrackerResponse(listed)
    expect(listedBody.data.items).toHaveLength(1)
    expect(listedBody.data.pagination).toEqual({
      page: 1,
      limit: 20,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    })
    const updated = await api(token)
      .patch(`/api/v1/weight-tracker/machines/${createdBody.data.machine.id}`)
      .send({ description: 'Updated' })
    expect(parseTrackerResponse(updated).data.machine.description).toBe(
      'Updated',
    )
  })

  it('isolates machines and hides cross-user resources', async () => {
    const owner = await createUser()
    const viewer = await createUser()
    const machine = await createMachineViaApi(owner.token)
    const viewerList = await api(viewer.token).get(
      '/api/v1/weight-tracker/machines',
    )
    expect(parseTrackerResponse(viewerList).data.items).toEqual([])
    expect(
      (
        await api(viewer.token).get(
          `/api/v1/weight-tracker/machines/${machine.id}`,
        )
      ).status,
    ).toBe(404)
    expect(
      (
        await api(viewer.token)
          .patch(`/api/v1/weight-tracker/machines/${machine.id}`)
          .send({ name: 'Stolen' })
      ).status,
    ).toBe(404)
  })

  it('deletes an unreferenced machine but rejects deletion when history references it', async () => {
    const { token } = await createUser()
    const first = await createMachineViaApi(token)
    const second = await createMachineViaApi(token, { name: 'Row Machine' })
    expect(
      (await api(token).delete(`/api/v1/weight-tracker/machines/${first.id}`))
        .status,
    ).toBe(204)
    const session = await createSessionViaApi(token)
    await createLogViaApi(token, session.id, { customMachineId: second.id })
    const blocked = await api(token).delete(
      `/api/v1/weight-tracker/machines/${second.id}`,
    )
    expect(blocked.status).toBe(409)
    expect(blocked.text).not.toContain('Prisma')
  })
})

describe('weight tracker session API', () => {
  it('creates sessions, defaults timestamps, and rejects invalid chronology', async () => {
    const { token } = await createUser()
    expect(
      (
        await api(token)
          .post('/api/v1/weight-tracker/sessions')
          .send({ notes: null })
      ).status,
    ).toBe(201)
    const invalid = await api(token)
      .post('/api/v1/weight-tracker/sessions')
      .send({
        startedAt: '2026-08-06T16:00:00.000Z',
        completedAt: '2026-08-06T15:00:00.000Z',
      })
    expect(invalid.status).toBe(400)
  })

  it('validates private or public workout-plan access', async () => {
    const owner = await createUser()
    const viewer = await createUser()
    const plan = await prisma.workoutPlan.create({
      data: {
        userId: owner.user.id,
        name: 'Private',
        difficultyLevel: 'BEGINNER',
      },
    })
    expect(
      (
        await api(viewer.token)
          .post('/api/v1/weight-tracker/sessions')
          .send({ workoutPlanId: plan.id })
      ).status,
    ).toBe(404)
    await prisma.workoutPlan.update({
      where: { id: plan.id },
      data: { isPublic: true },
    })
    expect(
      (
        await api(viewer.token)
          .post('/api/v1/weight-tracker/sessions')
          .send({ workoutPlanId: plan.id })
      ).status,
    ).toBe(201)
    const systemPlan = await prisma.workoutPlan.create({
      data: { name: 'System', difficultyLevel: 'BEGINNER' },
    })
    expect(
      (
        await api(viewer.token)
          .post('/api/v1/weight-tracker/sessions')
          .send({ workoutPlanId: systemPlan.id })
      ).status,
    ).toBe(201)
  })

  it('lists only owned sessions with completed filtering and summaries', async () => {
    const owner = await createUser()
    const viewer = await createUser()
    const exercise = await createExercise()
    const session = await createSessionViaApi(owner.token, {
      completedAt: '2026-08-06T16:00:00.000Z',
    })
    const log = await createLogViaApi(owner.token, session.id, {
      exerciseId: exercise.id,
    })
    await createSetViaApi(owner.token, log.id)
    await createSessionViaApi(viewer.token)
    const listed = await api(owner.token).get(
      '/api/v1/weight-tracker/sessions?completed=true',
    )
    const listedBody = parseTrackerResponse(listed)
    expect(listedBody.data.items[0]).toMatchObject({
      exerciseLogCount: 1,
      totalSetCount: 1,
      totalVolumeKg: 400,
      durationMinutes: 60,
    })
    expect(listedBody.data.items).toHaveLength(1)
  })

  it('returns ordered aggregate detail and safely completes idempotently', async () => {
    const { token } = await createUser()
    const exercise = await createExercise()
    const session = await createSessionViaApi(token)
    const log = await createLogViaApi(token, session.id, {
      exerciseId: exercise.id,
    })
    await createSetViaApi(token, log.id, { setNumber: 2 })
    await createSetViaApi(token, log.id, { setNumber: 1 })
    const completed = await api(token)
      .post(`/api/v1/weight-tracker/sessions/${session.id}/complete`)
      .send({ completedAt: '2026-08-06T16:00:00.000Z' })
    expect(completed.status).toBe(200)
    const again = await api(token)
      .post(`/api/v1/weight-tracker/sessions/${session.id}/complete`)
      .send({})
    expect(parseTrackerResponse(again).data.session.completedAt).toBe(
      '2026-08-06T16:00:00.000Z',
    )
    const detail = await api(token).get(
      `/api/v1/weight-tracker/sessions/${session.id}`,
    )
    expect(
      parseTrackerResponse(detail).data.session.exerciseLogs[0]?.sets.map(
        (set: { setNumber: number }) => set.setNumber,
      ),
    ).toEqual([1, 2])
  })

  it('hides cross-user sessions and deletes an owned aggregate', async () => {
    const owner = await createUser()
    const viewer = await createUser()
    const exercise = await createExercise()
    const session = await createSessionViaApi(owner.token)
    const log = await createLogViaApi(owner.token, session.id, {
      exerciseId: exercise.id,
    })
    await createSetViaApi(owner.token, log.id)
    expect(
      (
        await api(viewer.token).get(
          `/api/v1/weight-tracker/sessions/${session.id}`,
        )
      ).status,
    ).toBe(404)
    expect(
      (
        await api(owner.token).delete(
          `/api/v1/weight-tracker/sessions/${session.id}`,
        )
      ).status,
    ).toBe(204)
    expect(await prisma.exerciseSet.count()).toBe(0)
    expect(await prisma.exerciseLog.count()).toBe(0)
  })
})

describe('weight tracker log and set APIs', () => {
  it('creates exercise and machine logs and rejects invalid source invariants', async () => {
    const { token } = await createUser()
    const exercise = await createExercise()
    const machine = await createMachineViaApi(token)
    const session = await createSessionViaApi(token)
    expect(
      (
        await api(token)
          .post(`/api/v1/weight-tracker/sessions/${session.id}/logs`)
          .send({
            exerciseId: exercise.id,
            customMachineId: null,
            orderIndex: 0,
          })
      ).status,
    ).toBe(201)
    expect(
      (
        await api(token)
          .post(`/api/v1/weight-tracker/sessions/${session.id}/logs`)
          .send({
            exerciseId: null,
            customMachineId: machine.id,
            orderIndex: 1,
          })
      ).status,
    ).toBe(201)
    expect(
      (
        await api(token)
          .post(`/api/v1/weight-tracker/sessions/${session.id}/logs`)
          .send({
            exerciseId: exercise.id,
            customMachineId: machine.id,
            orderIndex: 2,
          })
      ).status,
    ).toBe(400)
    expect(
      (
        await api(token)
          .post(`/api/v1/weight-tracker/sessions/${session.id}/logs`)
          .send({ exerciseId: null, customMachineId: null, orderIndex: 2 })
      ).status,
    ).toBe(400)
  })

  it('rejects another user machine and reorders logs without unique conflicts', async () => {
    const owner = await createUser()
    const viewer = await createUser()
    const machine = await createMachineViaApi(owner.token)
    const exercise = await createExercise()
    const session = await createSessionViaApi(viewer.token)
    expect(
      (
        await api(viewer.token)
          .post(`/api/v1/weight-tracker/sessions/${session.id}/logs`)
          .send({
            customMachineId: machine.id,
            exerciseId: null,
            orderIndex: 0,
          })
      ).status,
    ).toBe(404)
    const first = await createLogViaApi(
      viewer.token,
      session.id,
      { exerciseId: exercise.id },
      0,
    )
    const second = await createLogViaApi(
      viewer.token,
      session.id,
      { exerciseId: exercise.id },
      1,
    )
    const reordered = await api(viewer.token)
      .post(`/api/v1/weight-tracker/sessions/${session.id}/logs/reorder`)
      .send({
        items: [
          { logId: first.id, orderIndex: 1 },
          { logId: second.id, orderIndex: 0 },
        ],
      })
    expect(reordered.status).toBe(200)
  })

  it('creates weighted and duration-only sets and rejects invalid metrics', async () => {
    const { token } = await createUser()
    const exercise = await createExercise()
    const session = await createSessionViaApi(token)
    const log = await createLogViaApi(token, session.id, {
      exerciseId: exercise.id,
    })
    expect(
      (
        await api(token)
          .post(`/api/v1/weight-tracker/logs/${log.id}/sets`)
          .send(setPayload)
      ).status,
    ).toBe(201)
    expect(
      (
        await api(token)
          .post(`/api/v1/weight-tracker/logs/${log.id}/sets`)
          .send({ setNumber: 2, durationSeconds: 60 })
      ).status,
    ).toBe(201)
    expect(
      (
        await api(token)
          .post(`/api/v1/weight-tracker/logs/${log.id}/sets`)
          .send({ setNumber: 3 })
      ).status,
    ).toBe(400)
    expect(
      (
        await api(token)
          .post(`/api/v1/weight-tracker/logs/${log.id}/sets`)
          .send({ setNumber: 3, reps: -1 })
      ).status,
    ).toBe(400)
  })

  it('updates and reorders sets, hides cross-user sets, and cascades log deletion', async () => {
    const owner = await createUser()
    const viewer = await createUser()
    const exercise = await createExercise()
    const session = await createSessionViaApi(owner.token)
    const log = await createLogViaApi(owner.token, session.id, {
      exerciseId: exercise.id,
    })
    const first = await createSetViaApi(owner.token, log.id, { setNumber: 1 })
    const second = await createSetViaApi(owner.token, log.id, { setNumber: 2 })
    const updatedSet = await api(owner.token)
      .patch(`/api/v1/weight-tracker/sets/${first.id}`)
      .send({ reps: 12 })
    expect(parseTrackerResponse(updatedSet).data.set.reps).toBe(12)
    expect(
      (
        await api(viewer.token)
          .patch(`/api/v1/weight-tracker/sets/${first.id}`)
          .send({ reps: 1 })
      ).status,
    ).toBe(404)
    expect(
      (
        await api(owner.token)
          .post(`/api/v1/weight-tracker/logs/${log.id}/sets/reorder`)
          .send({
            items: [
              { setId: first.id, setNumber: 2 },
              { setId: second.id, setNumber: 1 },
            ],
          })
      ).status,
    ).toBe(200)
    expect(
      (await api(owner.token).delete(`/api/v1/weight-tracker/logs/${log.id}`))
        .status,
    ).toBe(204)
    expect(await prisma.exerciseSet.count()).toBe(0)
  })

  it('rejects unauthenticated and malformed UUID requests safely', async () => {
    expect((await api().get('/api/v1/weight-tracker/machines')).status).toBe(
      401,
    )
    const { token } = await createUser()
    const response = await api(token).get(
      '/api/v1/weight-tracker/machines/not-a-uuid',
    )
    expect(response.status).toBe(400)
    expect(response.text).not.toContain('Prisma')
  })
})
