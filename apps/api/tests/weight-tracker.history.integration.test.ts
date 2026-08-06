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
  parseTrackerResponse,
} from './weight-tracker-test.helpers.js'

beforeEach(cleanWeightTrackerData)
afterAll(async () => {
  await cleanWeightTrackerData()
  await prisma.$disconnect()
})

const bulkEntry = (exerciseId: string, weightKg = 40, orderIndex = 0) => ({
  exerciseId,
  customMachineId: null,
  notes: null,
  orderIndex,
  sets: [
    {
      setNumber: 1,
      weightKg,
      reps: 10,
      durationSeconds: null,
      distanceMeters: null,
      isWarmup: false,
    },
  ],
})

const bulkPayload = (exerciseId: string) => ({
  startedAt: '2026-08-06T15:00:00.000Z',
  completedAt: '2026-08-06T16:00:00.000Z',
  notes: 'Push day',
  workoutPlanId: null,
  entries: [bulkEntry(exerciseId)],
})

describe('quick session creation', () => {
  it('creates an entire completed workout atomically', async () => {
    const { token } = await createUser()
    const exercise = await createExercise()
    const response = await api(token)
      .post('/api/v1/weight-tracker/sessions/with-entries')
      .send(bulkPayload(exercise.id))
    expect(response.status).toBe(201)
    expect(
      parseTrackerResponse(response).data.session.exerciseLogs[0]?.sets,
    ).toHaveLength(1)
    expect(await prisma.workoutSession.count()).toBe(1)
    expect(await prisma.exerciseSet.count()).toBe(1)
  })

  it('rolls back all writes when a nested reference is invalid', async () => {
    const { token } = await createUser()
    const payload = bulkPayload('00000000-0000-4000-8000-000000000000')
    expect(
      (
        await api(token)
          .post('/api/v1/weight-tracker/sessions/with-entries')
          .send(payload)
      ).status,
    ).toBe(404)
    expect(await prisma.workoutSession.count()).toBe(0)
  })

  it('rejects duplicate entry and set positions before writing', async () => {
    const { token } = await createUser()
    const exercise = await createExercise()
    const payload = bulkPayload(exercise.id)
    payload.entries.push(bulkEntry(exercise.id))
    expect(
      (
        await api(token)
          .post('/api/v1/weight-tracker/sessions/with-entries')
          .send(payload)
      ).status,
    ).toBe(400)
    const duplicateSets = bulkPayload(exercise.id)
    const duplicateSet = bulkEntry(exercise.id).sets[0]
    if (!duplicateSet) throw new Error('Expected set fixture')
    duplicateSets.entries[0]?.sets.push({ ...duplicateSet })
    expect(
      (
        await api(token)
          .post('/api/v1/weight-tracker/sessions/with-entries')
          .send(duplicateSets)
      ).status,
    ).toBe(400)
    expect(await prisma.workoutSession.count()).toBe(0)
  })

  it('enforces nested request-size limits and permits an intentional blank session', async () => {
    const { token } = await createUser()
    const exercise = await createExercise()
    const payload = bulkPayload(exercise.id)
    payload.entries = Array.from({ length: 51 }, (_, index) =>
      bulkEntry(exercise.id, 40, index),
    )
    expect(
      (
        await api(token)
          .post('/api/v1/weight-tracker/sessions/with-entries')
          .send(payload)
      ).status,
    ).toBe(400)
    const blank = await api(token)
      .post('/api/v1/weight-tracker/sessions/with-entries')
      .send({ entries: [] })
    expect(blank.status).toBe(201)
  })
})

describe('source history and PR consistency', () => {
  it('uses completed, non-warmup session maxima and calculates statistics', async () => {
    const { token } = await createUser()
    const exercise = await createExercise()
    for (const [day, weights] of [
      [1, [40, 100]],
      [2, [50, 55]],
      [3, [60]],
    ] as const) {
      const session = await createSessionViaApi(token, {
        startedAt: `2026-08-0${String(day)}T15:00:00.000Z`,
        completedAt: `2026-08-0${String(day)}T16:00:00.000Z`,
        notes: `Day ${String(day)}`,
      })
      const log = await createLogViaApi(token, session.id, {
        exerciseId: exercise.id,
      })
      for (const [index, weight] of weights.entries())
        await createSetViaApi(token, log.id, {
          setNumber: index + 1,
          weightKg: weight,
          isWarmup: day === 1 && index === 1,
        })
    }
    const incomplete = await createSessionViaApi(token)
    const incompleteLog = await createLogViaApi(token, incomplete.id, {
      exerciseId: exercise.id,
    })
    await createSetViaApi(token, incompleteLog.id, { weightKg: 200 })
    const response = await api(token).get(
      `/api/v1/weight-tracker/sources/exercise/${exercise.id}/history?limit=2`,
    )
    expect(response.status).toBe(200)
    const history = parseTrackerResponse(response).data.history
    expect(history).toMatchObject({
      personalRecordKg: 60,
      averageRepresentativeWeightKg: 51.67,
      latestRepresentativeWeightKg: 60,
      previousRepresentativeWeightKg: 55,
      bestImprovementKg: 15,
      totalSessions: 3,
    })
    expect(history.sessions.items).toHaveLength(2)
    expect(history.sessions.pagination.totalPages).toBe(2)
  })

  it('scopes global exercise history to the caller and machine history to its owner', async () => {
    const owner = await createUser()
    const viewer = await createUser()
    const exercise = await createExercise('Chest Press')
    const machine = await createMachineViaApi(owner.token, {
      name: 'Chest Press',
    })
    const session = await createSessionViaApi(owner.token, {
      completedAt: '2026-08-06T16:00:00.000Z',
    })
    const exerciseLog = await createLogViaApi(
      owner.token,
      session.id,
      { exerciseId: exercise.id },
      0,
    )
    await createSetViaApi(owner.token, exerciseLog.id, { weightKg: 60 })
    const machineLog = await createLogViaApi(
      owner.token,
      session.id,
      { customMachineId: machine.id },
      1,
    )
    await createSetViaApi(owner.token, machineLog.id, { weightKg: 70 })
    const viewerHistory = await api(viewer.token).get(
      `/api/v1/weight-tracker/sources/exercise/${exercise.id}/history`,
    )
    expect(parseTrackerResponse(viewerHistory).data.history.totalSessions).toBe(
      0,
    )
    expect(
      (
        await api(viewer.token).get(
          `/api/v1/weight-tracker/sources/machine/${machine.id}/history`,
        )
      ).status,
    ).toBe(404)
    const exerciseHistory = await api(owner.token).get(
      `/api/v1/weight-tracker/sources/exercise/${exercise.id}/history`,
    )
    const machineHistory = await api(owner.token).get(
      `/api/v1/weight-tracker/sources/machine/${machine.id}/history`,
    )
    expect(
      parseTrackerResponse(exerciseHistory).data.history.personalRecordKg,
    ).toBe(60)
    expect(
      parseTrackerResponse(machineHistory).data.history.personalRecordKg,
    ).toBe(70)
  })

  it('bounds chart points independently at thirty', async () => {
    const { user, token } = await createUser()
    const exercise = await createExercise()
    for (let index = 0; index < 31; index += 1) {
      const startedAt = new Date(Date.UTC(2026, 0, index + 1, 10))
      const completedAt = new Date(startedAt.getTime() + 3_600_000)
      await prisma.workoutSession.create({
        data: {
          userId: user.id,
          startedAt,
          completedAt,
          exerciseLogs: {
            create: {
              exerciseId: exercise.id,
              orderIndex: 0,
              sets: { create: { setNumber: 1, weightKg: 40 + index } },
            },
          },
        },
      })
    }
    const response = await api(token).get(
      `/api/v1/weight-tracker/sources/exercise/${exercise.id}/history?limit=1`,
    )
    const history = parseTrackerResponse(response).data.history
    expect(history.chartPoints).toHaveLength(30)
    expect(history.sessions.items).toHaveLength(1)
  })

  it('marks only strictly increasing chronological weights as PR events', async () => {
    const { token } = await createUser()
    const exercise = await createExercise()
    for (const [day, weight] of [
      [1, 50],
      [2, 50],
      [3, 60],
    ] as const) {
      const response = await api(token)
        .post('/api/v1/weight-tracker/sessions/with-entries')
        .send({
          ...bulkPayload(exercise.id),
          startedAt: `2026-08-0${String(day)}T15:00:00.000Z`,
          completedAt: `2026-08-0${String(day)}T16:00:00.000Z`,
          entries: [bulkEntry(exercise.id, weight)],
        })
      expect(response.status).toBe(201)
    }
    const sets = await prisma.exerciseSet.findMany({
      orderBy: { createdAt: 'asc' },
      select: { weightKg: true, isPersonalRecord: true },
    })
    expect(
      sets.map((set) => [Number(set.weightKg), set.isPersonalRecord]),
    ).toEqual([
      [50, true],
      [50, false],
      [60, true],
    ])
  })

  it('does not award incomplete sessions and recalculates after edits and deletes', async () => {
    const { token } = await createUser()
    const exercise = await createExercise()
    const first = await api(token)
      .post('/api/v1/weight-tracker/sessions/with-entries')
      .send({
        ...bulkPayload(exercise.id),
        entries: [bulkEntry(exercise.id, 50)],
      })
    const second = await api(token)
      .post('/api/v1/weight-tracker/sessions/with-entries')
      .send({
        ...bulkPayload(exercise.id),
        startedAt: '2026-08-07T15:00:00.000Z',
        completedAt: '2026-08-07T16:00:00.000Z',
        entries: [bulkEntry(exercise.id, 60)],
      })
    const firstSet =
      parseTrackerResponse(first).data.session.exerciseLogs[0]?.sets[0]
    const secondSet =
      parseTrackerResponse(second).data.session.exerciseLogs[0]?.sets[0]
    if (!firstSet || !secondSet) throw new Error('Expected created sets')
    await api(token)
      .patch(`/api/v1/weight-tracker/sets/${firstSet.id}`)
      .send({ weightKg: 70 })
    expect(
      (await prisma.exerciseSet.findUnique({ where: { id: secondSet.id } }))
        ?.isPersonalRecord,
    ).toBe(false)
    await api(token).delete(`/api/v1/weight-tracker/sets/${firstSet.id}`)
    expect(
      (await prisma.exerciseSet.findUnique({ where: { id: secondSet.id } }))
        ?.isPersonalRecord,
    ).toBe(true)
    const incomplete = await createSessionViaApi(token)
    const log = await createLogViaApi(token, incomplete.id, {
      exerciseId: exercise.id,
    })
    const set = await createSetViaApi(token, log.id, { weightKg: 100 })
    expect(
      (await prisma.exerciseSet.findUnique({ where: { id: set.id } }))
        ?.isPersonalRecord,
    ).toBe(false)
  })

  it('recalculates remaining history after deleting a completed session', async () => {
    const { token } = await createUser()
    const exercise = await createExercise()
    const earlier = await api(token)
      .post('/api/v1/weight-tracker/sessions/with-entries')
      .send(bulkPayload(exercise.id))
    const later = await api(token)
      .post('/api/v1/weight-tracker/sessions/with-entries')
      .send({
        ...bulkPayload(exercise.id),
        startedAt: '2026-08-07T15:00:00.000Z',
        completedAt: '2026-08-07T16:00:00.000Z',
        entries: [bulkEntry(exercise.id, 50)],
      })
    await api(token).delete(
      `/api/v1/weight-tracker/sessions/${parseTrackerResponse(earlier).data.session.id}`,
    )
    const remainingSetId =
      parseTrackerResponse(later).data.session.exerciseLogs[0]?.sets[0]?.id
    if (!remainingSetId) throw new Error('Expected remaining set')
    expect(
      (await prisma.exerciseSet.findUnique({ where: { id: remainingSetId } }))
        ?.isPersonalRecord,
    ).toBe(true)
  })
})
