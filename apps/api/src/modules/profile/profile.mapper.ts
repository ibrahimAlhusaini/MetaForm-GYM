import type { ProfileDetail } from '@metaform/shared-types'
import type { Prisma } from '../../generated/prisma/client.js'

export const profilePublicSelect = {
  fullName: true,
  birthDate: true,
  gender: true,
  heightCm: true,
  currentWeightKg: true,
  activityLevel: true,
  fitnessGoal: true,
} satisfies Prisma.ProfileSelect

export type ProfilePublicRow = Prisma.ProfileGetPayload<{
  select: typeof profilePublicSelect
}>

const decimalToNumber = (value: { toNumber: () => number }): number => {
  const number = value.toNumber()
  if (!Number.isFinite(number))
    throw new Error('Stored profile value is invalid')
  return number
}

const dateOnly = (date: Date): string => date.toISOString().slice(0, 10)

const normalizedName = (name: string | undefined): string | null => {
  const trimmed = name?.trim()
  return trimmed?.length ? trimmed : null
}

export const mapProfileDetail = (
  profile: ProfilePublicRow | null,
): ProfileDetail => ({
  initialized: profile !== null,
  fullName: normalizedName(profile?.fullName),
  birthDate: profile?.birthDate ? dateOnly(profile.birthDate) : null,
  gender: profile?.gender ?? null,
  heightCm: profile?.heightCm ? decimalToNumber(profile.heightCm) : null,
  currentWeightKg: profile?.currentWeightKg
    ? decimalToNumber(profile.currentWeightKg)
    : null,
  activityLevel: profile?.activityLevel ?? null,
  fitnessGoal: profile?.fitnessGoal ?? null,
})
