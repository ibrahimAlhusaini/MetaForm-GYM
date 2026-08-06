import type { Request, Response } from 'express'
import type { AppRequest } from '../../types/request.js'
import { asAppRequest, authenticatedUserId } from './weight-tracker.request.js'
import {
  completeSession,
  createSession,
  createSessionWithEntries,
  deleteSession,
  getSession,
  listSessions,
  updateSession,
} from './session.service.js'
import type {
  CompleteSessionInput,
  CreateSessionInput,
  CreateSessionWithEntriesInput,
  ListSessionsQuery,
  UpdateSessionInput,
} from './weight-tracker.validation.js'

const req = asAppRequest
const sessionId = (request: AppRequest) =>
  (request.validatedParams as { sessionId: string }).sessionId

export const createSessionController = async (
  request: Request,
  response: Response,
) => {
  const r = req(request)
  response.status(201).json({
    success: true,
    data: {
      session: await createSession(
        authenticatedUserId(r),
        r.validatedBody as CreateSessionInput,
      ),
    },
  })
}
export const listSessionsController = async (
  request: Request,
  response: Response,
) => {
  const r = req(request)
  response.json({
    success: true,
    data: await listSessions(
      authenticatedUserId(r),
      r.validatedQuery as ListSessionsQuery,
    ),
  })
}
export const getSessionController = async (
  request: Request,
  response: Response,
) => {
  const r = req(request)
  response.json({
    success: true,
    data: { session: await getSession(authenticatedUserId(r), sessionId(r)) },
  })
}
export const updateSessionController = async (
  request: Request,
  response: Response,
) => {
  const r = req(request)
  response.json({
    success: true,
    data: {
      session: await updateSession(
        authenticatedUserId(r),
        sessionId(r),
        r.validatedBody as UpdateSessionInput,
      ),
    },
  })
}
export const completeSessionController = async (
  request: Request,
  response: Response,
) => {
  const r = req(request)
  response.json({
    success: true,
    data: {
      session: await completeSession(
        authenticatedUserId(r),
        sessionId(r),
        r.validatedBody as CompleteSessionInput,
      ),
    },
  })
}
export const deleteSessionController = async (
  request: Request,
  response: Response,
) => {
  const r = req(request)
  await deleteSession(authenticatedUserId(r), sessionId(r))
  response.status(204).send()
}
export const createSessionWithEntriesController = async (
  request: Request,
  response: Response,
) => {
  const r = req(request)
  response.status(201).json({
    success: true,
    data: {
      session: await createSessionWithEntries(
        authenticatedUserId(r),
        r.validatedBody as CreateSessionWithEntriesInput,
      ),
    },
  })
}
