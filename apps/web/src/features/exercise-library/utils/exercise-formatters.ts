import type {
  ExerciseDifficultyLevel,
  ExerciseEquipmentType,
  ExerciseMovementType,
  ExerciseMuscleSubgroup,
  ExercisePrimaryMuscle,
} from '@metaform/shared-types'
import { muscleLabels } from '../../weight-tracker/constants/weight-tracker.constants.js'
import {
  difficultyLabels,
  equipmentLabels,
  movementLabels,
  subgroupLabels,
} from '../constants/exercise-library.constants.js'

export const primaryMuscleLabel = (value: ExercisePrimaryMuscle): string =>
  muscleLabels[value]
export const subgroupLabel = (value: ExerciseMuscleSubgroup | null): string =>
  value ? subgroupLabels[value] : 'Not classified'
export const equipmentLabel = (value: ExerciseEquipmentType): string =>
  equipmentLabels[value]
export const difficultyLabel = (value: ExerciseDifficultyLevel): string =>
  difficultyLabels[value]
export const movementLabel = (value: ExerciseMovementType): string =>
  movementLabels[value]

export const recommendationLabel = (
  sets: number | null,
  reps: string | null,
): string | null => {
  if (sets && reps) return `${String(sets)} sets × ${reps}`
  if (sets) return `${String(sets)} recommended sets`
  if (reps) return `${reps} recommended reps`
  return null
}
