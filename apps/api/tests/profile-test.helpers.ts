import type {
  ProfileCompletenessResponse,
  ProfileDetailResponse,
  ProfileSummaryResponse,
  ProfileUpdateResponse,
} from '@metaform/shared-types'
import request, { type Response } from 'supertest'
import { UserRole } from '../src/generated/prisma/client.js'
import { app } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { signAccessToken } from '../src/security/jwt.service.js'

let sequence = 0

export const cleanProfileTestData = async (): Promise<void> => {
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'profile-test-' } },
  })
}

export const createProfileUser = async (withProfile = true) => {
  sequence += 1
  const user = await prisma.user.create({
    data: {
      email: `profile-test-${String(sequence)}@example.com`,
      passwordHash: 'not-used',
      ...(withProfile
        ? { profile: { create: { fullName: 'Profile Tester' } } }
        : {}),
    },
  })
  return { user, token: signAccessToken(user.id, UserRole.USER) }
}

export const profileApi = (token?: string) => ({
  get: (path: string) => {
    const call = request(app).get(path)
    return token ? call.set('Authorization', `Bearer ${token}`) : call
  },
  patch: (path: string) => {
    const call = request(app).patch(path)
    return token ? call.set('Authorization', `Bearer ${token}`) : call
  },
})

export const parseProfile = (response: Response) =>
  JSON.parse(response.text) as ProfileDetailResponse
export const parseProfileUpdate = (response: Response) =>
  JSON.parse(response.text) as ProfileUpdateResponse
export const parseCompleteness = (response: Response) =>
  JSON.parse(response.text) as ProfileCompletenessResponse
export const parseSummary = (response: Response) =>
  JSON.parse(response.text) as ProfileSummaryResponse

export const birthDateForAge = (age: number): string => {
  const now = new Date()
  return [
    String(now.getUTCFullYear() - age).padStart(4, '0'),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('-')
}
