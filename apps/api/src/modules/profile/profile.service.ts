import type {
  ProfileCompleteness,
  ProfileDetail,
  ProfileSummary,
} from '@metaform/shared-types'
import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/app-error.js'
import { ageFromBirthDate } from '../../utils/age.js'
import { calculateProfileCompleteness } from './profile.completeness.js'
import { mapProfileDetail, profilePublicSelect } from './profile.mapper.js'
import type { UpdateProfileInput } from './profile.validation.js'

export const getProfile = async (userId: string): Promise<ProfileDetail> => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: profilePublicSelect,
  })
  return mapProfileDetail(profile)
}

const profileUpdateData = (input: UpdateProfileInput) => ({
  ...(input.fullName === undefined ? {} : { fullName: input.fullName }),
  ...(input.birthDate === undefined ? {} : { birthDate: input.birthDate }),
  ...(input.gender === undefined ? {} : { gender: input.gender }),
  ...(input.heightCm === undefined ? {} : { heightCm: input.heightCm }),
  ...(input.currentWeightKg === undefined
    ? {}
    : { currentWeightKg: input.currentWeightKg }),
  ...(input.activityLevel === undefined
    ? {}
    : { activityLevel: input.activityLevel }),
  ...(input.fitnessGoal === undefined
    ? {}
    : { fitnessGoal: input.fitnessGoal }),
})

export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput,
): Promise<ProfileDetail> => {
  const existing = await prisma.profile.findUnique({
    where: { userId },
    select: { fullName: true },
  })
  const initializationName = input.fullName ?? existing?.fullName
  if (!initializationName) {
    throw new AppError(400, 'Full name is required to initialize the profile', {
      missingFields: ['fullName'],
    })
  }
  const updateData = profileUpdateData(input)
  const profile = await prisma.profile.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      fullName: initializationName,
      ...updateData,
    },
    select: profilePublicSelect,
  })
  return mapProfileDetail(profile)
}

export const getProfileCompleteness = async (
  userId: string,
): Promise<ProfileCompleteness> =>
  calculateProfileCompleteness(await getProfile(userId))

export const getProfileSummary = async (
  userId: string,
  now = new Date(),
): Promise<ProfileSummary> => {
  const profile = await getProfile(userId)
  const completeness = calculateProfileCompleteness(profile)
  return {
    displayName: profile.fullName,
    age: profile.birthDate
      ? ageFromBirthDate(new Date(`${profile.birthDate}T00:00:00.000Z`), now)
      : null,
    gender: profile.gender,
    heightCm: profile.heightCm,
    currentWeightKg: profile.currentWeightKg,
    activityLevel: profile.activityLevel,
    fitnessGoal: profile.fitnessGoal,
    completeness: {
      percentage: completeness.percentage,
      complete: completeness.complete,
    },
  }
}
