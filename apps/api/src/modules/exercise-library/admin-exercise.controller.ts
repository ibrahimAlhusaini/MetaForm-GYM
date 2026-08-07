import type { Request, Response } from 'express'
import type { AppRequest } from '../../types/request.js'
import {
  createAdminExercise,
  deleteAdminExercise,
  getAdminExercise,
  listAdminExercises,
  publishAdminExercise,
  unpublishAdminExercise,
  updateAdminExercise,
} from './admin-exercise.service.js'
import type {
  AdminExerciseListQuery,
  CreateExerciseInput,
  UpdateExerciseInput,
} from './exercise-library.validation.js'

const appRequest = (request: Request) => request as AppRequest
const exerciseId = (request: Request): string =>
  (appRequest(request).validatedParams as { exerciseId: string }).exerciseId

export const createAdminExerciseController = async (
  request: Request,
  response: Response,
) => {
  response.status(201).json({
    success: true,
    data: {
      exercise: await createAdminExercise(
        appRequest(request).validatedBody as CreateExerciseInput,
      ),
    },
  })
}

export const listAdminExercisesController = async (
  request: Request,
  response: Response,
) => {
  response.json({
    success: true,
    data: await listAdminExercises(
      appRequest(request).validatedQuery as AdminExerciseListQuery,
    ),
  })
}

export const getAdminExerciseController = async (
  request: Request,
  response: Response,
) => {
  response.json({
    success: true,
    data: { exercise: await getAdminExercise(exerciseId(request)) },
  })
}

export const updateAdminExerciseController = async (
  request: Request,
  response: Response,
) => {
  response.json({
    success: true,
    data: {
      exercise: await updateAdminExercise(
        exerciseId(request),
        appRequest(request).validatedBody as UpdateExerciseInput,
      ),
    },
  })
}

export const publishAdminExerciseController = async (
  request: Request,
  response: Response,
) => {
  response.json({
    success: true,
    data: { exercise: await publishAdminExercise(exerciseId(request)) },
  })
}

export const unpublishAdminExerciseController = async (
  request: Request,
  response: Response,
) => {
  response.json({
    success: true,
    data: { exercise: await unpublishAdminExercise(exerciseId(request)) },
  })
}

export const deleteAdminExerciseController = async (
  request: Request,
  response: Response,
) => {
  await deleteAdminExercise(exerciseId(request))
  response.status(204).send()
}
