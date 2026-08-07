import type {
  ProfileCompleteness,
  ProfileCompletenessFields,
  ProfileDetail,
} from '@metaform/shared-types'
import { PROFILE_COMPLETENESS_FIELDS } from './profile.constants.js'

export const calculateProfileCompleteness = (
  profile: ProfileDetail,
): ProfileCompleteness => {
  const fields: ProfileCompletenessFields = {
    fullName: Boolean(profile.fullName?.trim()),
    birthDate: profile.birthDate !== null,
    gender: profile.gender !== null,
    heightCm: profile.heightCm !== null,
    currentWeightKg: profile.currentWeightKg !== null,
    activityLevel: profile.activityLevel !== null,
    fitnessGoal: profile.fitnessGoal !== null,
  }
  const missingFields = PROFILE_COMPLETENESS_FIELDS.filter(
    (field) => !fields[field],
  )
  const completedCount =
    PROFILE_COMPLETENESS_FIELDS.length - missingFields.length
  const percentage = Math.round(
    (completedCount / PROFILE_COMPLETENESS_FIELDS.length) * 100,
  )
  return {
    percentage,
    complete: missingFields.length === 0,
    fields,
    missingFields,
  }
}
