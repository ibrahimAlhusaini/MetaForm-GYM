import type { ErrorRequestHandler } from 'express'
import { AppError } from '../utils/app-error.js'
import type { AppRequest } from '../types/request.js'
import { logError } from '../utils/logger.js'

const safeCode = (error: AppError): string | undefined => {
  const code = error.details?.code
  return typeof code === 'string' && /^[A-Z0-9_]+$/.test(code)
    ? code
    : undefined
}

const httpErrorStatus = (error: unknown): 400 | 413 | null => {
  if (typeof error !== 'object' || error === null || !('status' in error))
    return null
  const status = (error as { status?: unknown }).status
  if (status === 413) return 413
  if (status === 400 && error instanceof SyntaxError) return 400
  return null
}

export const errorHandler: ErrorRequestHandler = (
  error,
  request,
  response,
  _next,
) => {
  void _next

  const requestId = (request as AppRequest).requestId

  if (error instanceof AppError) {
    if (error.statusCode >= 500)
      logError('request_failed', {
        requestId,
        method: request.method,
        statusCode: error.statusCode,
        errorClass: 'AppError',
        code: safeCode(error),
      })
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    })
    return
  }

  const parserStatus = httpErrorStatus(error)
  if (parserStatus !== null) {
    response.status(parserStatus).json({
      success: false,
      message:
        parserStatus === 413
          ? 'Request body is too large'
          : 'Malformed JSON body',
    })
    return
  }

  logError('request_failed', {
    requestId,
    method: request.method,
    statusCode: 500,
    errorClass: error instanceof Error ? error.name : 'UnknownError',
  })
  response.status(500).json({
    success: false,
    message: 'Internal server error',
  })
}
