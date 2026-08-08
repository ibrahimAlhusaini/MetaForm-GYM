import type { Request } from 'express'
import type { AuthContext } from '../modules/auth/auth.types.js'

export type AppRequest = Request & {
  requestId?: string
  auth?: AuthContext
  validatedBody?: unknown
  validatedParams?: unknown
  validatedQuery?: unknown
}
