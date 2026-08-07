import type {
  ProfileCompletenessResponse,
  ProfileDetailResponse,
  ProfileSummaryResponse,
  ProfileUpdateResponse,
} from '@metaform/shared-types'
import type { Request, Response } from 'express'
import type { AppRequest } from '../../types/request.js'
import { AppError } from '../../utils/app-error.js'
import {
  getProfile,
  getProfileCompleteness,
  getProfileSummary,
  updateProfile,
} from './profile.service.js'
import type { UpdateProfileInput } from './profile.validation.js'

const authenticatedUserId = (request: Request): string => {
  const auth = (request as AppRequest).auth
  if (!auth) throw new AppError(401, 'Authentication required')
  return auth.userId
}

export const getProfileController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const body: ProfileDetailResponse = {
    success: true,
    data: await getProfile(authenticatedUserId(request)),
  }
  response.status(200).json(body)
}

export const updateProfileController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const body: ProfileUpdateResponse = {
    success: true,
    message: 'Profile updated successfully',
    data: await updateProfile(
      authenticatedUserId(request),
      (request as AppRequest).validatedBody as UpdateProfileInput,
    ),
  }
  response.status(200).json(body)
}

export const getProfileCompletenessController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const body: ProfileCompletenessResponse = {
    success: true,
    data: await getProfileCompleteness(authenticatedUserId(request)),
  }
  response.status(200).json(body)
}

export const getProfileSummaryController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const body: ProfileSummaryResponse = {
    success: true,
    data: await getProfileSummary(authenticatedUserId(request)),
  }
  response.status(200).json(body)
}
