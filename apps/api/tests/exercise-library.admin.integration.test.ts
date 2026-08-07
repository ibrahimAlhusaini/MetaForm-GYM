import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import {
  MuscleGroup,
  MuscleSubgroup,
  UserRole,
} from '../src/generated/prisma/client.js'
import { prisma } from '../src/config/prisma.js'
import {
  cleanExerciseLibraryData,
  createExerciseRecord,
  createExerciseViaAdmin,
  createLibraryUser,
  exercisePayload,
  libraryApi,
  parseLibraryResponse,
  submitExerciseViaAdmin,
} from './exercise-library-test.helpers.js'

beforeEach(cleanExerciseLibraryData)
afterAll(async () => {
  await cleanExerciseLibraryData()
  await prisma.$disconnect()
})

describe('admin exercise authorization and creation', () => {
  it('returns 403 to a normal user', async () => {
    const { token } = await createLibraryUser()
    expect(
      (
        await libraryApi(token)
          .post('/api/v1/admin/exercises')
          .send(exercisePayload)
      ).status,
    ).toBe(403)
  })

  it('creates metadata, generates a deterministic slug, and normalizes blanks', async () => {
    const { token } = await createLibraryUser(UserRole.ADMIN)
    const { response, exercise } = await createExerciseViaAdmin(token, {
      name: '  Incline Élite Press  ',
      description: '',
      videoUrl: '',
      thumbnailUrl: 'https://cdn.example.com/press.jpg',
    })
    expect(response.status).toBe(201)
    expect(exercise.slug).toBe('incline-elite-press')
    expect(exercise.videoUrl).toBeNull()
    expect(parseLibraryResponse(response).data.exercise.description).toBeNull()
  })

  it('normalizes a supplied slug', async () => {
    const { token } = await createLibraryUser(UserRole.ADMIN)
    const { exercise } = await createExerciseViaAdmin(token, {
      slug: '  Custom Exercise SLUG  ',
    })
    expect(exercise.slug).toBe('custom-exercise-slug')
  })

  it('returns 409 for duplicate slugs without exposing Prisma', async () => {
    const { token } = await createLibraryUser(UserRole.ADMIN)
    await createExerciseViaAdmin(token, { slug: 'duplicate-exercise' })
    const duplicate = await submitExerciseViaAdmin(token, {
      name: 'Another Exercise',
      slug: 'duplicate-exercise',
    })
    expect(duplicate.status).toBe(409)
    expect(duplicate.text).not.toMatch(/Prisma|P2002|SQL/)
  })

  it.each([
    ['an incompatible subgroup', { muscleSubgroup: MuscleSubgroup.LATS }],
    [
      'duplicate secondary muscles',
      { secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.TRICEPS] },
    ],
    [
      'the primary muscle repeated as secondary',
      { secondaryMuscles: [MuscleGroup.CHEST] },
    ],
    ['a non-http video URL', { videoUrl: 'ftp://example.com/video.mp4' }],
    ['a malformed thumbnail URL', { thumbnailUrl: 'not-a-url' }],
  ])('rejects %s', async (_scenario, overrides) => {
    const { token } = await createLibraryUser(UserRole.ADMIN)
    const response = await submitExerciseViaAdmin(token, overrides)
    expect(response.status).toBe(400)
  })

  it('rejects mass-assignment fields', async () => {
    const { token } = await createLibraryUser(UserRole.ADMIN)
    const response = await libraryApi(token)
      .post('/api/v1/admin/exercises')
      .send({
        ...exercisePayload,
        userId: '11111111-1111-4111-8111-111111111111',
      })
    expect(response.status).toBe(400)
  })

  it('rejects create-as-published when instructions are missing', async () => {
    const { token } = await createLibraryUser(UserRole.ADMIN)
    const response = await submitExerciseViaAdmin(token, {
      isPublished: true,
      instructions: [],
    })
    expect(response.status).toBe(400)
    expect(parseLibraryResponse(response).message).toContain('instructions')
  })
})

describe('admin exercise listing and updates', () => {
  it('lists unpublished metadata and supports published-state filtering', async () => {
    const { token } = await createLibraryUser(UserRole.ADMIN)
    await createExerciseRecord({ isPublished: false })
    await createExerciseRecord({ name: 'Published Press', isPublished: true })
    const response = await libraryApi(token).get(
      '/api/v1/admin/exercises?isPublished=false&sortBy=name&sortOrder=asc',
    )
    expect(response.status).toBe(200)
    expect(parseLibraryResponse(response).data.items).toHaveLength(1)
    expect(parseLibraryResponse(response).data.items[0]?.isPublished).toBe(
      false,
    )
  })

  it('returns unpublished detail to an admin', async () => {
    const { token } = await createLibraryUser(UserRole.ADMIN)
    const exercise = await createExerciseRecord({ isPublished: false })
    const response = await libraryApi(token).get(
      `/api/v1/admin/exercises/${exercise.id}`,
    )
    expect(response.status).toBe(200)
    expect(parseLibraryResponse(response).data.exercise.id).toBe(exercise.id)
  })

  it('updates explicitly allowed metadata and normalizes nullable URLs', async () => {
    const { token } = await createLibraryUser(UserRole.ADMIN)
    const exercise = await createExerciseRecord({ isPublished: false })
    const response = await libraryApi(token)
      .patch(`/api/v1/admin/exercises/${exercise.id}`)
      .send({
        name: 'Updated Press',
        slug: ' Updated Press Slug ',
        videoUrl: '',
      })
    expect(response.status).toBe(200)
    expect(parseLibraryResponse(response).data.exercise).toMatchObject({
      name: 'Updated Press',
      slug: 'updated-press-slug',
      videoUrl: null,
    })
  })

  it('validates primary muscle and subgroup after merging partial updates', async () => {
    const { token } = await createLibraryUser(UserRole.ADMIN)
    const exercise = await createExerciseRecord({ isPublished: false })
    const response = await libraryApi(token)
      .patch(`/api/v1/admin/exercises/${exercise.id}`)
      .send({ primaryMuscle: MuscleGroup.BACK })
    expect(response.status).toBe(400)
    expect(parseLibraryResponse(response).message).toContain('not compatible')
  })

  it('does not allow publication through the metadata patch route', async () => {
    const { token } = await createLibraryUser(UserRole.ADMIN)
    const exercise = await createExerciseRecord({ isPublished: false })
    const response = await libraryApi(token)
      .patch(`/api/v1/admin/exercises/${exercise.id}`)
      .send({ isPublished: true })
    expect(response.status).toBe(400)
  })
})

describe('admin publish lifecycle', () => {
  it('rejects publication when required instructions are missing', async () => {
    const { token } = await createLibraryUser(UserRole.ADMIN)
    const exercise = await createExerciseRecord({
      instructions: [],
      isPublished: false,
    })
    const response = await libraryApi(token).post(
      `/api/v1/admin/exercises/${exercise.id}/publish`,
    )
    expect(response.status).toBe(400)
  })

  it('publishes complete metadata without requiring a video', async () => {
    const admin = await createLibraryUser(UserRole.ADMIN)
    const user = await createLibraryUser()
    const exercise = await createExerciseRecord({
      videoUrl: null,
      isPublished: false,
    })
    const published = await libraryApi(admin.token).post(
      `/api/v1/admin/exercises/${exercise.id}/publish`,
    )
    const publicDetail = await libraryApi(user.token).get(
      `/api/v1/exercises/${exercise.id}`,
    )
    expect(parseLibraryResponse(published).data.exercise.isPublished).toBe(true)
    expect(publicDetail.status).toBe(200)
    expect(parseLibraryResponse(publicDetail).data.exercise.videoUrl).toBeNull()
  })

  it('unpublishes idempotently and removes the exercise from public discovery', async () => {
    const admin = await createLibraryUser(UserRole.ADMIN)
    const user = await createLibraryUser()
    const exercise = await createExerciseRecord({ isPublished: true })
    const first = await libraryApi(admin.token).post(
      `/api/v1/admin/exercises/${exercise.id}/unpublish`,
    )
    const second = await libraryApi(admin.token).post(
      `/api/v1/admin/exercises/${exercise.id}/unpublish`,
    )
    const listing = await libraryApi(user.token).get('/api/v1/exercises')
    expect(parseLibraryResponse(first).data.exercise.isPublished).toBe(false)
    expect(second.status).toBe(200)
    expect(parseLibraryResponse(listing).data.items).toEqual([])
  })
})

describe('admin deletion and Weight Tracker compatibility', () => {
  it('deletes an unreferenced exercise', async () => {
    const { token } = await createLibraryUser(UserRole.ADMIN)
    const exercise = await createExerciseRecord({ isPublished: false })
    expect(
      (await libraryApi(token).delete(`/api/v1/admin/exercises/${exercise.id}`))
        .status,
    ).toBe(204)
  })

  it('returns 409 for an ExerciseLog reference and preserves dashboard history after unpublishing', async () => {
    const admin = await createLibraryUser(UserRole.ADMIN)
    const user = await createLibraryUser()
    const exercise = await createExerciseRecord({ isPublished: true })
    const session = await prisma.workoutSession.create({
      data: {
        userId: user.user.id,
        startedAt: new Date('2026-08-06T15:00:00.000Z'),
        completedAt: new Date('2026-08-06T16:00:00.000Z'),
      },
    })
    const log = await prisma.exerciseLog.create({
      data: {
        workoutSessionId: session.id,
        exerciseId: exercise.id,
        orderIndex: 0,
      },
    })
    await prisma.exerciseSet.create({
      data: { exerciseLogId: log.id, setNumber: 1, weightKg: 60, reps: 5 },
    })
    await libraryApi(admin.token).post(
      `/api/v1/admin/exercises/${exercise.id}/unpublish`,
    )
    const dashboard = await libraryApi(user.token).get(
      '/api/v1/dashboard/summary',
    )
    const deletion = await libraryApi(admin.token).delete(
      `/api/v1/admin/exercises/${exercise.id}`,
    )
    expect(
      parseLibraryResponse(dashboard).data.strengthProgress.machines[0]
        ?.sourceId,
    ).toBe(exercise.id)
    expect(deletion.status).toBe(409)
    expect(deletion.text).not.toMatch(/Prisma|P2003|SQL/)
    expect(
      await prisma.exerciseLog.count({ where: { exerciseId: exercise.id } }),
    ).toBe(1)
  })

  it('returns 409 for a WorkoutPlanExercise reference', async () => {
    const admin = await createLibraryUser(UserRole.ADMIN)
    const exercise = await createExerciseRecord({ isPublished: false })
    const plan = await prisma.workoutPlan.create({
      data: { name: 'Referenced Plan', difficultyLevel: 'BEGINNER' },
    })
    const day = await prisma.workoutPlanDay.create({
      data: {
        workoutPlanId: plan.id,
        dayOfWeek: 'MONDAY',
        orderIndex: 0,
      },
    })
    await prisma.workoutPlanExercise.create({
      data: {
        workoutPlanDayId: day.id,
        exerciseId: exercise.id,
        orderIndex: 0,
      },
    })
    const response = await libraryApi(admin.token).delete(
      `/api/v1/admin/exercises/${exercise.id}`,
    )
    expect(response.status).toBe(409)
  })

  it('rejects unpublished exercises as new Weight Tracker sources', async () => {
    const user = await createLibraryUser()
    const exercise = await createExerciseRecord({ isPublished: false })
    const session = await prisma.workoutSession.create({
      data: { userId: user.user.id },
    })
    const response = await libraryApi(user.token)
      .post(`/api/v1/weight-tracker/sessions/${session.id}/logs`)
      .send({
        exerciseId: exercise.id,
        customMachineId: null,
        notes: null,
        orderIndex: 0,
      })
    expect(response.status).toBe(404)
  })
})
