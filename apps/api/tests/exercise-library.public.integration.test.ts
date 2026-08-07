import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import {
  DifficultyLevel,
  EquipmentType,
  MovementType,
  MuscleGroup,
  MuscleSubgroup,
} from '../src/generated/prisma/client.js'
import { prisma } from '../src/config/prisma.js'
import {
  cleanExerciseLibraryData,
  createExerciseRecord,
  createLibraryUser,
  libraryApi,
  parseLibraryResponse,
} from './exercise-library-test.helpers.js'

beforeEach(cleanExerciseLibraryData)
afterAll(async () => {
  await cleanExerciseLibraryData()
  await prisma.$disconnect()
})

describe('public exercise library authentication and visibility', () => {
  it('returns 401 without authentication', async () => {
    expect((await libraryApi().get('/api/v1/exercises')).status).toBe(401)
  })

  it('lists published exercises and hides unpublished exercises', async () => {
    const { token } = await createLibraryUser()
    const published = await createExerciseRecord({ isPublished: true })
    await createExerciseRecord({ name: 'Hidden Draft', isPublished: false })
    const response = await libraryApi(token).get('/api/v1/exercises')
    expect(response.status).toBe(200)
    expect(parseLibraryResponse(response).data.items).toHaveLength(1)
    expect(parseLibraryResponse(response).data.items[0]?.id).toBe(published.id)
  })

  it('returns safe 404 for unpublished and nonexistent details', async () => {
    const { token } = await createLibraryUser()
    const draft = await createExerciseRecord({ isPublished: false })
    const hidden = await libraryApi(token).get(`/api/v1/exercises/${draft.id}`)
    const absent = await libraryApi(token).get(
      '/api/v1/exercises/11111111-1111-4111-8111-111111111111',
    )
    expect(hidden.status).toBe(404)
    expect(absent.status).toBe(404)
    expect(parseLibraryResponse(hidden).message).toBe(
      parseLibraryResponse(absent).message,
    )
  })

  it('returns safe 404 for an unpublished slug', async () => {
    const { token } = await createLibraryUser()
    const draft = await createExerciseRecord({ isPublished: false })
    const response = await libraryApi(token).get(
      `/api/v1/exercises/slug/${draft.slug}`,
    )
    expect(response.status).toBe(404)
    expect(parseLibraryResponse(response).message).toBe('Resource not found')
  })

  it('continues to enforce inactive-account behavior', async () => {
    const { user, token } = await createLibraryUser()
    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: false },
    })
    expect((await libraryApi(token).get('/api/v1/exercises')).status).toBe(403)
  })
})

describe('public exercise discovery filters', () => {
  it.each([
    ['name', 'incline'],
    ['description', 'pressing'],
  ])('searches case-insensitively by %s', async (_field, search) => {
    const { token } = await createLibraryUser()
    await createExerciseRecord({ isPublished: true })
    const response = await libraryApi(token).get(
      `/api/v1/exercises?search=${search.toUpperCase()}`,
    )
    expect(parseLibraryResponse(response).data.items).toHaveLength(1)
  })

  it.each([
    ['primaryMuscle', MuscleGroup.CHEST],
    ['muscleSubgroup', MuscleSubgroup.UPPER_CHEST],
    ['secondaryMuscle', MuscleGroup.TRICEPS],
    ['equipmentType', EquipmentType.BARBELL],
    ['difficultyLevel', DifficultyLevel.INTERMEDIATE],
    ['movementType', MovementType.COMPOUND],
  ])('filters by %s', async (key, value) => {
    const { token } = await createLibraryUser()
    await createExerciseRecord({ isPublished: true })
    const response = await libraryApi(token).get(
      `/api/v1/exercises?${key}=${value}`,
    )
    expect(parseLibraryResponse(response).data.items).toHaveLength(1)
  })

  it('supports combined filters without leaking mismatches', async () => {
    const { token } = await createLibraryUser()
    await createExerciseRecord({ isPublished: true })
    await createExerciseRecord({
      name: 'Cable Row',
      primaryMuscle: MuscleGroup.BACK,
      muscleSubgroup: MuscleSubgroup.LATS,
      equipmentType: EquipmentType.CABLE,
      isPublished: true,
    })
    const response = await libraryApi(token).get(
      '/api/v1/exercises?primaryMuscle=CHEST&muscleSubgroup=UPPER_CHEST&equipmentType=BARBELL&difficultyLevel=INTERMEDIATE&movementType=COMPOUND',
    )
    expect(parseLibraryResponse(response).data.items).toHaveLength(1)
    expect(parseLibraryResponse(response).data.items[0]?.name).toContain(
      'Incline',
    )
  })
})

describe('public exercise pagination, detail, and options', () => {
  it('sorts stably and returns one-based pagination metadata', async () => {
    const { token } = await createLibraryUser()
    await createExerciseRecord({ name: 'Zulu Press', isPublished: true })
    await createExerciseRecord({ name: 'Alpha Press', isPublished: true })
    const response = await libraryApi(token).get(
      '/api/v1/exercises?page=1&limit=1&sortBy=name&sortOrder=asc',
    )
    expect(parseLibraryResponse(response).data.items[0]?.name).toBe(
      'Alpha Press',
    )
    expect(parseLibraryResponse(response).data.pagination).toMatchObject({
      page: 1,
      limit: 1,
      totalItems: 2,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    })
  })

  it('rejects a page limit above 100', async () => {
    const { token } = await createLibraryUser()
    expect(
      (await libraryApi(token).get('/api/v1/exercises?limit=101')).status,
    ).toBe(400)
  })

  it('returns published detail by UUID and normalized slug', async () => {
    const { token } = await createLibraryUser()
    const exercise = await createExerciseRecord({
      slug: 'exercise-library-test-normalized-slug',
      isPublished: true,
    })
    const byId = await libraryApi(token).get(`/api/v1/exercises/${exercise.id}`)
    const bySlug = await libraryApi(token).get(
      '/api/v1/exercises/slug/Exercise Library Test Normalized Slug',
    )
    expect(parseLibraryResponse(byId).data.exercise.instructions).toHaveLength(
      2,
    )
    expect(parseLibraryResponse(bySlug).data.exercise.id).toBe(exercise.id)
  })

  it('returns the typed filter options from one compatibility map', async () => {
    const { token } = await createLibraryUser()
    const response = await libraryApi(token).get(
      '/api/v1/exercises/filter-options',
    )
    expect(parseLibraryResponse(response).data.primaryMuscles).toContain(
      'CHEST',
    )
    expect(
      parseLibraryResponse(response).data.muscleSubgroupsByPrimaryMuscle.CHEST,
    ).toContain('UPPER_CHEST')
    expect(parseLibraryResponse(response).data.equipmentTypes).toContain(
      'BARBELL',
    )
  })

  it('returns bounded searchable options without large content fields', async () => {
    const { token } = await createLibraryUser()
    const exercise = await createExerciseRecord({ isPublished: true })
    await createExerciseRecord({ name: 'Hidden Option', isPublished: false })
    const response = await libraryApi(token).get(
      '/api/v1/exercises/options?search=incline&limit=1',
    )
    const item = parseLibraryResponse(response).data.items[0]
    expect(parseLibraryResponse(response).data.items).toHaveLength(1)
    expect(item?.id).toBe(exercise.id)
    expect(item).not.toHaveProperty('instructions')
    expect(item).not.toHaveProperty('description')
  })

  it('rejects an options limit above 50', async () => {
    const { token } = await createLibraryUser()
    expect(
      (await libraryApi(token).get('/api/v1/exercises/options?limit=51'))
        .status,
    ).toBe(400)
  })

  it('handles invalid UUIDs safely without Prisma details', async () => {
    const { token } = await createLibraryUser()
    const response = await libraryApi(token).get('/api/v1/exercises/not-a-uuid')
    expect(response.status).toBe(400)
    expect(JSON.stringify(parseLibraryResponse(response))).not.toMatch(
      /Prisma|SQL|stack/i,
    )
  })

  it('does not expose workout or user data in exercise responses', async () => {
    const { token } = await createLibraryUser()
    await createExerciseRecord({ isPublished: true })
    const response = await libraryApi(token).get('/api/v1/exercises')
    const serialized = JSON.stringify(parseLibraryResponse(response))
    expect(serialized).not.toMatch(
      /passwordHash|refreshToken|exerciseLogs|userId/,
    )
  })
})
