import type { Request, Response } from 'express'
import { asAppRequest, authenticatedUserId } from './weight-tracker.request.js'
import { createSet, deleteSet, reorderSets, updateSet } from './set.service.js'
import type {
  CreateSetInput,
  ReorderSetsInput,
  UpdateSetInput,
} from './weight-tracker.validation.js'

const req = asAppRequest
export const createSetController = async (
  request: Request,
  response: Response,
) => {
  const r = req(request)
  const { logId } = r.validatedParams as { logId: string }
  response.status(201).json({
    success: true,
    data: {
      set: await createSet(
        authenticatedUserId(r),
        logId,
        r.validatedBody as CreateSetInput,
      ),
    },
  })
}
export const updateSetController = async (
  request: Request,
  response: Response,
) => {
  const r = req(request)
  const { setId } = r.validatedParams as { setId: string }
  response.json({
    success: true,
    data: {
      set: await updateSet(
        authenticatedUserId(r),
        setId,
        r.validatedBody as UpdateSetInput,
      ),
    },
  })
}
export const deleteSetController = async (
  request: Request,
  response: Response,
) => {
  const r = req(request)
  const { setId } = r.validatedParams as { setId: string }
  await deleteSet(authenticatedUserId(r), setId)
  response.status(204).send()
}
export const reorderSetsController = async (
  request: Request,
  response: Response,
) => {
  const r = req(request)
  const { logId } = r.validatedParams as { logId: string }
  await reorderSets(
    authenticatedUserId(r),
    logId,
    r.validatedBody as ReorderSetsInput,
  )
  response.json({ success: true, data: { reordered: true } })
}
