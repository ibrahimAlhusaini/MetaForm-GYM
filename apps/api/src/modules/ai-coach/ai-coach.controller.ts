import type {
  AiCoachCapabilitiesResponse,
  AiCoachSessionHistoryResponse,
  AiCoachSessionResponse,
} from '@metaform/shared-types'
import type { Request, Response } from 'express'
import type { AppRequest } from '../../types/request.js'
import { AppError } from '../../utils/app-error.js'
import {
  createAiCoachSession,
  getAiCoachSession,
  listAiCoachCapabilities,
  listAiCoachSessions,
} from './ai-coach.service.js'
import type {
  AiCoachHistoryInput,
  AiCoachSessionParams,
  CreateAiCoachSessionInput,
} from './ai-coach.validation.js'

const userId = (request: Request): string => {
  const auth = (request as AppRequest).auth
  if (!auth) throw new AppError(401, 'Authentication required')
  return auth.userId
}
export const listAiCoachCapabilitiesController = (
  _request: Request,
  response: Response,
): void => {
  const body: AiCoachCapabilitiesResponse = {
    success: true,
    data: listAiCoachCapabilities(),
  }
  response.status(200).json(body)
}
export const createAiCoachSessionController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const body: AiCoachSessionResponse = {
    success: true,
    data: await createAiCoachSession(
      userId(request),
      (request as AppRequest).validatedBody as CreateAiCoachSessionInput,
    ),
  }
  response.status(201).json(body)
}
export const listAiCoachSessionsController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const body: AiCoachSessionHistoryResponse = {
    success: true,
    data: await listAiCoachSessions(
      userId(request),
      (request as AppRequest).validatedQuery as AiCoachHistoryInput,
    ),
  }
  response.status(200).json(body)
}
export const getAiCoachSessionController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const params = (request as AppRequest).validatedParams as AiCoachSessionParams
  const body: AiCoachSessionResponse = {
    success: true,
    data: await getAiCoachSession(userId(request), params.sessionId),
  }
  response.status(200).json(body)
}
