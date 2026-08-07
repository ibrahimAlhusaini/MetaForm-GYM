import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/app-error.js'
import { paginationMetadata, paginationSkip } from '../../utils/pagination.js'
import {
  EXERCISE_DELETE_CONFLICT,
  EXERCISE_NOT_FOUND,
} from './exercise-library.constants.js'
import {
  adminExerciseDetailSelect,
  mapAdminExerciseDetail,
} from './exercise-library.mapper.js'
import {
  adminExerciseWhere,
  exerciseOrderBy,
} from './exercise-library.query.js'
import { normalizeExerciseSlug } from './exercise-library.slug.js'
import {
  isCompatibleSubgroup,
  type AdminExerciseListQuery,
  type CreateExerciseInput,
  type UpdateExerciseInput,
} from './exercise-library.validation.js'

const notFound = (): never => {
  throw new AppError(404, EXERCISE_NOT_FOUND)
}
const translateDatabaseError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002')
      throw new AppError(409, 'An exercise with this slug already exists')
    if (error.code === 'P2003')
      throw new AppError(409, EXERCISE_DELETE_CONFLICT)
  }
  throw error
}

interface PublishableExercise {
  name: string
  primaryMuscle: CreateExerciseInput['primaryMuscle']
  muscleSubgroup: CreateExerciseInput['muscleSubgroup'] | null
  equipmentType: CreateExerciseInput['equipmentType']
  difficultyLevel: CreateExerciseInput['difficultyLevel']
  movementType: CreateExerciseInput['movementType']
  instructions: string[]
}

const requirePublishable = (exercise: PublishableExercise): void => {
  if (
    !exercise.name ||
    !exercise.muscleSubgroup ||
    !isCompatibleSubgroup(exercise.primaryMuscle, exercise.muscleSubgroup) ||
    exercise.instructions.length === 0
  )
    throw new AppError(
      400,
      'Exercise requires complete classification and instructions before publication',
    )
}

export const createAdminExercise = async (input: CreateExerciseInput) => {
  if (input.isPublished) requirePublishable(input)
  try {
    const exercise = await prisma.exercise.create({
      data: {
        name: input.name,
        slug: input.slug ?? normalizeExerciseSlug(input.name),
        description: input.description ?? null,
        primaryMuscle: input.primaryMuscle,
        muscleSubgroup: input.muscleSubgroup,
        secondaryMuscles: input.secondaryMuscles,
        equipmentType: input.equipmentType,
        difficultyLevel: input.difficultyLevel,
        movementType: input.movementType,
        instructions: input.instructions,
        commonMistakes: input.commonMistakes,
        recommendedSets: input.recommendedSets ?? null,
        recommendedReps: input.recommendedReps ?? null,
        videoUrl: input.videoUrl ?? null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        isPublished: input.isPublished,
      },
      select: adminExerciseDetailSelect,
    })
    return mapAdminExerciseDetail(exercise)
  } catch (error) {
    return translateDatabaseError(error)
  }
}

export const listAdminExercises = async (query: AdminExerciseListQuery) => {
  const where = adminExerciseWhere(query)
  const [totalItems, exercises] = await prisma.$transaction([
    prisma.exercise.count({ where }),
    prisma.exercise.findMany({
      where,
      select: adminExerciseDetailSelect,
      orderBy: exerciseOrderBy(query.sortBy, query.sortOrder),
      skip: paginationSkip(query),
      take: query.limit,
    }),
  ])
  return {
    items: exercises.map(mapAdminExerciseDetail),
    pagination: paginationMetadata(query, totalItems),
  }
}

export const getAdminExercise = async (exerciseId: string) => {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: adminExerciseDetailSelect,
  })
  return exercise ? mapAdminExerciseDetail(exercise) : notFound()
}

const updateData = (input: UpdateExerciseInput): Prisma.ExerciseUpdateInput => {
  const data: Prisma.ExerciseUpdateInput = {}
  if (input.name !== undefined) data.name = input.name
  if (input.slug !== undefined) data.slug = input.slug
  if (input.description !== undefined) data.description = input.description
  if (input.primaryMuscle !== undefined)
    data.primaryMuscle = input.primaryMuscle
  if (input.muscleSubgroup !== undefined)
    data.muscleSubgroup = input.muscleSubgroup
  if (input.secondaryMuscles !== undefined)
    data.secondaryMuscles = input.secondaryMuscles
  if (input.equipmentType !== undefined)
    data.equipmentType = input.equipmentType
  if (input.difficultyLevel !== undefined)
    data.difficultyLevel = input.difficultyLevel
  if (input.movementType !== undefined) data.movementType = input.movementType
  if (input.instructions !== undefined) data.instructions = input.instructions
  if (input.commonMistakes !== undefined)
    data.commonMistakes = input.commonMistakes
  if (input.recommendedSets !== undefined)
    data.recommendedSets = input.recommendedSets
  if (input.recommendedReps !== undefined)
    data.recommendedReps = input.recommendedReps
  if (input.videoUrl !== undefined) data.videoUrl = input.videoUrl
  if (input.thumbnailUrl !== undefined) data.thumbnailUrl = input.thumbnailUrl
  return data
}

export const updateAdminExercise = async (
  exerciseId: string,
  input: UpdateExerciseInput,
) => {
  const current = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: adminExerciseDetailSelect,
  })
  if (!current) return notFound()
  const primaryMuscle = input.primaryMuscle ?? current.primaryMuscle
  const muscleSubgroup =
    input.muscleSubgroup === undefined
      ? current.muscleSubgroup
      : input.muscleSubgroup
  const secondaryMuscles = input.secondaryMuscles ?? current.secondaryMuscles
  if (muscleSubgroup && !isCompatibleSubgroup(primaryMuscle, muscleSubgroup))
    throw new AppError(
      400,
      'Muscle subgroup is not compatible with primary muscle',
    )
  if (secondaryMuscles.includes(primaryMuscle))
    throw new AppError(
      400,
      'Primary muscle must not be repeated as a secondary muscle',
    )
  try {
    const updated = await prisma.exercise.update({
      where: { id: exerciseId },
      data: updateData(input),
      select: adminExerciseDetailSelect,
    })
    return mapAdminExerciseDetail(updated)
  } catch (error) {
    return translateDatabaseError(error)
  }
}

export const publishAdminExercise = async (exerciseId: string) => {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: adminExerciseDetailSelect,
  })
  if (!exercise) return notFound()
  requirePublishable(exercise)
  if (exercise.isPublished) return mapAdminExerciseDetail(exercise)
  return mapAdminExerciseDetail(
    await prisma.exercise.update({
      where: { id: exerciseId },
      data: { isPublished: true },
      select: adminExerciseDetailSelect,
    }),
  )
}

export const unpublishAdminExercise = async (exerciseId: string) => {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: adminExerciseDetailSelect,
  })
  if (!exercise) return notFound()
  if (!exercise.isPublished) return mapAdminExerciseDetail(exercise)
  return mapAdminExerciseDetail(
    await prisma.exercise.update({
      where: { id: exerciseId },
      data: { isPublished: false },
      select: adminExerciseDetailSelect,
    }),
  )
}

export const deleteAdminExercise = async (exerciseId: string) => {
  try {
    await prisma.$transaction(async (transaction) => {
      const exercise = await transaction.exercise.findUnique({
        where: { id: exerciseId },
        select: { id: true },
      })
      if (!exercise) return notFound()
      const [logCount, planCount] = await Promise.all([
        transaction.exerciseLog.count({ where: { exerciseId } }),
        transaction.workoutPlanExercise.count({ where: { exerciseId } }),
      ])
      if (logCount > 0 || planCount > 0)
        throw new AppError(409, EXERCISE_DELETE_CONFLICT)
      await transaction.exercise.delete({ where: { id: exerciseId } })
    })
  } catch (error) {
    if (error instanceof AppError) throw error
    translateDatabaseError(error)
  }
}
