import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import type { AppRequest } from '../types/request.js'

export const requestId = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  const id = randomUUID()
  ;(request as AppRequest).requestId = id
  response.setHeader('X-Request-ID', id)
  next()
}
