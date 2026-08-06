import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'
import type { AppRequest } from '../types/request.js'
import { AppError } from '../utils/app-error.js'

export const validateBody = (schema: ZodType): RequestHandler => {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body)

    if (!result.success) {
      next(new AppError(400, 'Invalid request data'))
      return
    }

    ;(request as AppRequest).validatedBody = result.data
    next()
  }
}

const createValidator = (
  schema: ZodType,
  source: 'params' | 'query',
  target: 'validatedParams' | 'validatedQuery',
): RequestHandler => {
  return (request, _response, next) => {
    const result = schema.safeParse(request[source])

    if (!result.success) {
      next(new AppError(400, 'Invalid request data'))
      return
    }

    ;(request as AppRequest)[target] = result.data
    next()
  }
}

export const validateParams = (schema: ZodType): RequestHandler =>
  createValidator(schema, 'params', 'validatedParams')

export const validateQuery = (schema: ZodType): RequestHandler =>
  createValidator(schema, 'query', 'validatedQuery')
