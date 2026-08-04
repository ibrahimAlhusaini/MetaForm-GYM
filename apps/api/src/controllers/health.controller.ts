import type { Request, Response } from 'express'
import type { HealthResponse } from '@metaform/shared-types'
import { isDatabaseHealthy } from '../services/database-health.service.js'
import { AppError } from '../utils/app-error.js'

export const getHealth = (_request: Request, response: Response): void => {
  const body: HealthResponse = {
    success: true,
    message: 'API is running',
  }

  response.status(200).json(body)
}

export const getDatabaseHealth = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  const databaseIsHealthy = await isDatabaseHealthy()

  if (!databaseIsHealthy) {
    throw new AppError(503, 'Database connection is unavailable')
  }

  const body: HealthResponse = {
    success: true,
    message: 'Database connection is healthy',
  }

  response.status(200).json(body)
}
