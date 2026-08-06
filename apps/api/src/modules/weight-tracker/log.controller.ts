import type { Request, Response } from 'express'
import { asAppRequest, authenticatedUserId } from './weight-tracker.request.js'
import { createLog, deleteLog, reorderLogs, updateLog } from './log.service.js'
import type {
  CreateLogInput,
  ReorderLogsInput,
  UpdateLogInput,
} from './weight-tracker.validation.js'

const req = asAppRequest
export const createLogController = async (
  request: Request,
  response: Response,
) => {
  const r = req(request)
  const { sessionId } = r.validatedParams as { sessionId: string }
  response.status(201).json({
    success: true,
    data: {
      log: await createLog(
        authenticatedUserId(r),
        sessionId,
        r.validatedBody as CreateLogInput,
      ),
    },
  })
}
export const updateLogController = async (
  request: Request,
  response: Response,
) => {
  const r = req(request)
  const { logId } = r.validatedParams as { logId: string }
  response.json({
    success: true,
    data: {
      log: await updateLog(
        authenticatedUserId(r),
        logId,
        r.validatedBody as UpdateLogInput,
      ),
    },
  })
}
export const deleteLogController = async (
  request: Request,
  response: Response,
) => {
  const r = req(request)
  const { logId } = r.validatedParams as { logId: string }
  await deleteLog(authenticatedUserId(r), logId)
  response.status(204).send()
}
export const reorderLogsController = async (
  request: Request,
  response: Response,
) => {
  const r = req(request)
  const { sessionId } = r.validatedParams as { sessionId: string }
  await reorderLogs(
    authenticatedUserId(r),
    sessionId,
    r.validatedBody as ReorderLogsInput,
  )
  response.json({ success: true, data: { reordered: true } })
}
