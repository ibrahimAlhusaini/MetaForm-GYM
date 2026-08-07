import type {
  ProfileCompleteness,
  ProfileDetail,
  ProfileSummary,
} from '@metaform/shared-types'

export const completeProfile: ProfileDetail = {
  initialized: true,
  fullName: 'Meta Member',
  birthDate: '1998-08-07',
  gender: 'MALE',
  heightCm: 178,
  currentWeightKg: 82,
  activityLevel: 'MODERATE',
  fitnessGoal: 'BUILD_MUSCLE',
}

export const missingProfile: ProfileDetail = {
  initialized: false,
  fullName: null,
  birthDate: null,
  gender: null,
  heightCm: null,
  currentWeightKg: null,
  activityLevel: null,
  fitnessGoal: null,
}

export const profileCompleteness: ProfileCompleteness = {
  percentage: 100,
  complete: true,
  fields: {
    fullName: true,
    birthDate: true,
    gender: true,
    heightCm: true,
    currentWeightKg: true,
    activityLevel: true,
    fitnessGoal: true,
  },
  missingFields: [],
}

export const profileSummary: ProfileSummary = {
  displayName: 'Meta Member',
  age: 28,
  gender: 'MALE',
  heightCm: 178,
  currentWeightKg: 82,
  activityLevel: 'MODERATE',
  fitnessGoal: 'BUILD_MUSCLE',
  completeness: { percentage: 100, complete: true },
}
