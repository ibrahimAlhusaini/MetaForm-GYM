import type { Request, Response } from 'express'
import type { DashboardSummaryResponse } from '@metaform/shared-types'
import type { AppRequest } from '../../types/request.js'
import { AppError } from '../../utils/app-error.js'
import { getDashboardSummary } from './dashboard.service.js'

export const getDashboardSummaryController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const auth = (request as AppRequest).auth

  if (!auth) {
    throw new AppError(401, 'Authentication required')
  }

  const body: DashboardSummaryResponse = {
    success: true,
    data: await getDashboardSummary(auth.userId),
  }

  response.status(200).json(body)
}
