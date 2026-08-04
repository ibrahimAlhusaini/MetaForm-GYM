import type { UserRole } from '../../generated/prisma/client.js'

export interface RequestMetadata {
  userAgent: string | null
  ipAddress: string | null
}

export interface AuthContext {
  userId: string
  role: UserRole
}

export interface AuthenticatedUserSummary {
  id: string
  email: string
  role: UserRole
  profile: {
    fullName: string
  } | null
}

export interface AuthenticationResult {
  user: AuthenticatedUserSummary
  accessToken: string
  refreshToken: string
}
