import type { Request, Response } from 'express'
import type { AppRequest } from '../../types/request.js'
import {
  getExerciseFilterOptions,
  getPublishedExerciseById,
  getPublishedExerciseBySlug,
  listExerciseOptions,
  listPublishedExercises,
} from './exercise-library.service.js'
import type {
  ExerciseOptionsQuery,
  PublicExerciseListQuery,
} from './exercise-library.validation.js'

const appRequest = (request: Request) => request as AppRequest

export const listExercisesController = async (
  request: Request,
  response: Response,
) => {
  const req = appRequest(request)
  response.json({
    success: true,
    data: await listPublishedExercises(
      req.validatedQuery as PublicExerciseListQuery,
    ),
  })
}

export const getExerciseController = async (
  request: Request,
  response: Response,
) => {
  const { exerciseId } = appRequest(request).validatedParams as {
    exerciseId: string
  }
  response.json({
    success: true,
    data: { exercise: await getPublishedExerciseById(exerciseId) },
  })
}

export const getExerciseBySlugController = async (
  request: Request,
  response: Response,
) => {
  const { slug } = appRequest(request).validatedParams as { slug: string }
  response.json({
    success: true,
    data: { exercise: await getPublishedExerciseBySlug(slug) },
  })
}

export const listExerciseOptionsController = async (
  request: Request,
  response: Response,
) => {
  const req = appRequest(request)
  response.json({
    success: true,
    data: await listExerciseOptions(req.validatedQuery as ExerciseOptionsQuery),
  })
}

export const getExerciseFilterOptionsController = (
  _request: Request,
  response: Response,
) => {
  void _request
  response.json({ success: true, data: getExerciseFilterOptions() })
}
