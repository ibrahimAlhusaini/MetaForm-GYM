import { randomUUID } from 'node:crypto'
import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../config/prisma.js'
import {
  getRefreshTokenExpiration,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../security/jwt.service.js'
import {
  hashPassword,
  verifyPassword,
} from '../../security/password.service.js'
import {
  hashRefreshToken,
  refreshTokenHashesMatch,
} from '../../security/token-hash.js'
import { AppError } from '../../utils/app-error.js'
import type { AuthenticationResult, RequestMetadata } from './auth.types.js'
import type { LoginInput, RegisterInput } from './auth.validation.js'

const authenticatedUserSelect = {
  id: true,
  email: true,
  role: true,
  profile: {
    select: {
      fullName: true,
    },
  },
} satisfies Prisma.UserSelect

const createRefreshSession = (userId: string, metadata: RequestMetadata) => {
  const tokenId = randomUUID()
  const refreshToken = signRefreshToken(userId, tokenId)

  return {
    refreshToken,
    data: {
      id: tokenId,
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshTokenExpiration(),
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    } satisfies Prisma.RefreshTokenUncheckedCreateInput,
  }
}

const isDuplicateEmailError = (error: unknown): boolean => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
}

export const registerUser = async (
  input: RegisterInput,
  metadata: RequestMetadata,
): Promise<AuthenticationResult> => {
  const passwordHash = await hashPassword(input.password)

  try {
    return await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          email: input.email,
          passwordHash,
          profile: {
            create: {
              fullName: input.fullName,
            },
          },
        },
        select: authenticatedUserSelect,
      })
      const session = createRefreshSession(user.id, metadata)

      await transaction.refreshToken.create({ data: session.data })

      return {
        user,
        accessToken: signAccessToken(user.id, user.role),
        refreshToken: session.refreshToken,
      }
    })
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw new AppError(409, 'An account with this email already exists')
    }

    throw error
  }
}

export const loginUser = async (
  input: LoginInput,
  metadata: RequestMetadata,
): Promise<AuthenticationResult> => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      ...authenticatedUserSelect,
      isActive: true,
      passwordHash: true,
    },
  })
  const passwordIsValid = await verifyPassword(
    input.password,
    user?.passwordHash,
  )

  if (!user || !passwordIsValid) {
    throw new AppError(401, 'Invalid email or password')
  }

  if (!user.isActive) {
    throw new AppError(403, 'Account is inactive')
  }

  const session = createRefreshSession(user.id, metadata)
  await prisma.refreshToken.create({ data: session.data })

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    },
    accessToken: signAccessToken(user.id, user.role),
    refreshToken: session.refreshToken,
  }
}

export const rotateRefreshToken = async (
  rawRefreshToken: string,
  metadata: RequestMetadata,
): Promise<{ accessToken: string; refreshToken: string }> => {
  const payload = verifyRefreshToken(rawRefreshToken)
  const currentSession = await prisma.refreshToken.findUnique({
    where: { id: payload.jti },
    select: {
      tokenHash: true,
      expiresAt: true,
      revokedAt: true,
      user: {
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      },
    },
  })

  if (
    currentSession?.user.id !== payload.sub ||
    currentSession.revokedAt !== null ||
    currentSession.expiresAt <= new Date() ||
    !refreshTokenHashesMatch(rawRefreshToken, currentSession.tokenHash)
  ) {
    throw new AppError(401, 'Invalid refresh token')
  }

  if (!currentSession.user.isActive) {
    throw new AppError(403, 'Account is inactive')
  }

  const replacementSession = createRefreshSession(payload.sub, metadata)
  const revokedAt = new Date()

  await prisma.$transaction(async (transaction) => {
    const revokedSession = await transaction.refreshToken.updateMany({
      where: {
        id: payload.jti,
        userId: payload.sub,
        tokenHash: currentSession.tokenHash,
        revokedAt: null,
        expiresAt: { gt: revokedAt },
      },
      data: { revokedAt },
    })

    if (revokedSession.count !== 1) {
      throw new AppError(401, 'Invalid refresh token')
    }

    await transaction.refreshToken.create({ data: replacementSession.data })
  })

  return {
    accessToken: signAccessToken(
      currentSession.user.id,
      currentSession.user.role,
    ),
    refreshToken: replacementSession.refreshToken,
  }
}

export const revokeRefreshToken = async (
  rawRefreshToken: string | undefined,
): Promise<void> => {
  if (!rawRefreshToken) {
    return
  }

  try {
    const payload = verifyRefreshToken(rawRefreshToken)
    const tokenHash = hashRefreshToken(rawRefreshToken)

    await prisma.refreshToken.updateMany({
      where: {
        id: payload.jti,
        userId: payload.sub,
        tokenHash,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    })
  } catch {
    // Logout remains idempotent and always clears the client cookie.
  }
}

export const getAuthenticatedUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      profile: {
        select: {
          fullName: true,
          profileImageUrl: true,
          gender: true,
          heightCm: true,
          currentWeightKg: true,
          birthDate: true,
          fitnessGoal: true,
          activityLevel: true,
        },
      },
    },
  })

  if (!user) {
    throw new AppError(401, 'Authentication required')
  }

  if (!user.isActive) {
    throw new AppError(403, 'Account is inactive')
  }

  return user
}
