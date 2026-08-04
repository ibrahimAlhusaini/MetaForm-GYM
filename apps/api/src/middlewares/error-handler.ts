import type { ErrorRequestHandler } from 'express'
import { AppError } from '../utils/app-error.js'

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  void error
  void _next

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
    return
  }

  console.error('Unhandled application error')
  response.status(500).json({
    success: false,
    message: 'Internal server error',
  })
}
