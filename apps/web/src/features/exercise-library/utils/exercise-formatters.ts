import type {
  ExerciseDifficultyLevel,
  ExerciseEquipmentType,
  ExerciseMovementType,
  ExerciseMuscleSubgroup,
  ExercisePrimaryMuscle,
} from '@metaform/shared-types'
import i18n from '../../../i18n/index.js'
import {
  difficultyLabel as translatedDifficulty,
  equipmentLabel as translatedEquipment,
  movementLabel as translatedMovement,
  muscleLabel,
  subgroupLabel as translatedSubgroup,
} from '../../../i18n/enum-labels.js'

export const primaryMuscleLabel = (value: ExercisePrimaryMuscle): string =>
  muscleLabel(i18n.t, value)
export const subgroupLabel = (value: ExerciseMuscleSubgroup | null): string =>
  value
    ? translatedSubgroup(i18n.t, value)
    : i18n.t('states.notClassified', { ns: 'common' })
export const equipmentLabel = (value: ExerciseEquipmentType): string =>
  translatedEquipment(i18n.t, value)
export const difficultyLabel = (value: ExerciseDifficultyLevel): string =>
  translatedDifficulty(i18n.t, value)
export const movementLabel = (value: ExerciseMovementType): string =>
  translatedMovement(i18n.t, value)
export const recommendationLabel = (
  sets: number | null,
  reps: string | null,
): string | null => {
  if (sets && reps)
    return i18n.t('recommendation.setsAndReps', {
      ns: 'exerciseLibrary',
      sets,
      reps,
    })
  if (sets)
    return i18n.t('recommendation.sets', { ns: 'exerciseLibrary', sets })
  if (reps)
    return i18n.t('recommendation.reps', { ns: 'exerciseLibrary', reps })
  return null
}
