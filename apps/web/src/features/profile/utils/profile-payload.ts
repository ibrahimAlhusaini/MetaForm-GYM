import type {
  ProfileDetail,
  ProfileUpdateRequest,
} from '@metaform/shared-types'
import type {
  ProfileDirtyFields,
  ProfileFormValues,
} from '../types/profile.types.js'

export const profileToFormValues = (
  profile: ProfileDetail,
): ProfileFormValues => ({
  fullName: profile.fullName ?? '',
  birthDate: profile.birthDate ?? '',
  gender: profile.gender ?? '',
  heightCm: profile.heightCm === null ? '' : String(profile.heightCm),
  currentWeightKg:
    profile.currentWeightKg === null ? '' : String(profile.currentWeightKg),
  activityLevel: profile.activityLevel ?? '',
  fitnessGoal: profile.fitnessGoal ?? '',
})

const nullableNumber = (value: string): number | null =>
  value.trim() ? Number(value) : null

export const buildProfileUpdatePayload = (
  values: ProfileFormValues,
  dirty: ProfileDirtyFields,
  initialized: boolean,
): ProfileUpdateRequest => ({
  ...(!initialized || dirty.fullName
    ? { fullName: values.fullName.trim() }
    : {}),
  ...(dirty.birthDate ? { birthDate: values.birthDate || null } : {}),
  ...(dirty.gender ? { gender: values.gender || null } : {}),
  ...(dirty.heightCm ? { heightCm: nullableNumber(values.heightCm) } : {}),
  ...(dirty.currentWeightKg
    ? { currentWeightKg: nullableNumber(values.currentWeightKg) }
    : {}),
  ...(dirty.activityLevel
    ? { activityLevel: values.activityLevel || null }
    : {}),
  ...(dirty.fitnessGoal ? { fitnessGoal: values.fitnessGoal || null } : {}),
})

export const hasProfileUpdates = (
  dirty: ProfileDirtyFields,
  initialized: boolean,
): boolean => !initialized || Object.values(dirty).some(Boolean)
