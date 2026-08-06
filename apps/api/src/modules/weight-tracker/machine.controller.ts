import type { Request, Response } from 'express'
import { asAppRequest, authenticatedUserId } from './weight-tracker.request.js'
import type {
  CreateMachineInput,
  ListMachinesQuery,
  UpdateMachineInput,
} from './weight-tracker.validation.js'
import {
  createMachine,
  deleteMachine,
  getMachine,
  listMachines,
  updateMachine,
} from './machine.service.js'

const context = asAppRequest

export const createMachineController = async (
  request: Request,
  response: Response,
) => {
  const req = context(request)
  response.status(201).json({
    success: true,
    data: {
      machine: await createMachine(
        authenticatedUserId(req),
        req.validatedBody as CreateMachineInput,
      ),
    },
  })
}
export const listMachinesController = async (
  request: Request,
  response: Response,
) => {
  const req = context(request)
  response.json({
    success: true,
    data: await listMachines(
      authenticatedUserId(req),
      req.validatedQuery as ListMachinesQuery,
    ),
  })
}
export const getMachineController = async (
  request: Request,
  response: Response,
) => {
  const req = context(request)
  const { machineId } = req.validatedParams as { machineId: string }
  response.json({
    success: true,
    data: { machine: await getMachine(authenticatedUserId(req), machineId) },
  })
}
export const updateMachineController = async (
  request: Request,
  response: Response,
) => {
  const req = context(request)
  const { machineId } = req.validatedParams as { machineId: string }
  response.json({
    success: true,
    data: {
      machine: await updateMachine(
        authenticatedUserId(req),
        machineId,
        req.validatedBody as UpdateMachineInput,
      ),
    },
  })
}
export const deleteMachineController = async (
  request: Request,
  response: Response,
) => {
  const req = context(request)
  const { machineId } = req.validatedParams as { machineId: string }
  await deleteMachine(authenticatedUserId(req), machineId)
  response.status(204).send()
}
