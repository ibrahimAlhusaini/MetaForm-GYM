import type {
  NutritionCalculationResponse,
  NutritionHistoryResponse,
  NutritionLatestResponse,
  NutritionProfileInputsResponse,
} from '@metaform/shared-types'
import type { Request, Response } from 'express'
import type { AppRequest } from '../../types/request.js'
import { AppError } from '../../utils/app-error.js'
import {
  calculateAndSaveNutrition,
  getLatestNutrition,
  getNutritionHistory,
  getNutritionProfileInputs,
} from './nutrition.service.js'
import type {
  CalculateNutritionInput,
  NutritionHistoryInput,
} from './nutrition.validation.js'

const authenticatedUserId = (request: Request): string => {
  const appRequest = request as AppRequest
  if (!appRequest.auth) throw new AppError(401, 'Authentication required')
  return appRequest.auth.userId
}

export const calculateNutritionController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const userId = authenticatedUserId(request)
  const appRequest = request as AppRequest
  const body: NutritionCalculationResponse = {
    success: true,
    message: 'Nutrition targets calculated successfully',
    data: await calculateAndSaveNutrition(
      userId,
      appRequest.validatedBody as CalculateNutritionInput,
    ),
  }
  response.status(201).json(body)
}

export const getNutritionProfileInputsController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const userId = authenticatedUserId(request)
  const body: NutritionProfileInputsResponse = {
    success: true,
    data: await getNutritionProfileInputs(userId),
  }
  response.status(200).json(body)
}

export const getLatestNutritionController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const userId = authenticatedUserId(request)
  const body: NutritionLatestResponse = {
    success: true,
    data: await getLatestNutrition(userId),
  }
  response.status(200).json(body)
}

export const getNutritionHistoryController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const userId = authenticatedUserId(request)
  const appRequest = request as AppRequest
  const body: NutritionHistoryResponse = {
    success: true,
    data: await getNutritionHistory(
      userId,
      appRequest.validatedQuery as NutritionHistoryInput,
    ),
  }
  response.status(200).json(body)
}
