import type {
  DashboardMuscleGroup,
  ExerciseDifficultyLevel,
  ExerciseEquipmentType,
  ExerciseMovementType,
  ExerciseMuscleSubgroup,
  NutritionActivityLevel,
  NutritionBmiCategory,
  NutritionBmrFormula,
  NutritionFitnessGoal,
  NutritionGender,
  NutritionInputSource,
  WorkoutPlanDayOfWeek,
  WorkoutPlanOwnershipType,
} from '@metaform/shared-types'
import type { TFunction } from 'i18next'

const label = (t: TFunction, group: string, value: string): string =>
  t(`enums.${group}.${value}`, { ns: 'common' })

export const muscleLabel = (t: TFunction, value: DashboardMuscleGroup) =>
  label(t, 'muscle', value)
export const subgroupLabel = (t: TFunction, value: ExerciseMuscleSubgroup) =>
  label(t, 'subgroup', value)
export const equipmentLabel = (t: TFunction, value: ExerciseEquipmentType) =>
  label(t, 'equipment', value)
export const difficultyLabel = (t: TFunction, value: ExerciseDifficultyLevel) =>
  label(t, 'difficulty', value)
export const movementLabel = (t: TFunction, value: ExerciseMovementType) =>
  label(t, 'movement', value)
export const genderLabel = (t: TFunction, value: NutritionGender) =>
  label(t, 'gender', value)
export const activityLabel = (t: TFunction, value: NutritionActivityLevel) =>
  label(t, 'activity', value)
export const fitnessGoalLabel = (t: TFunction, value: NutritionFitnessGoal) =>
  label(t, 'goal', value)
export const bmiCategoryLabel = (t: TFunction, value: NutritionBmiCategory) =>
  label(t, 'bmi', value)
export const inputSourceLabel = (t: TFunction, value: NutritionInputSource) =>
  label(t, 'inputSource', value)
export const bmrFormulaLabel = (t: TFunction, value: NutritionBmrFormula) =>
  label(t, 'bmrFormula', value)
export const sessionStatusLabel = (t: TFunction, completed: boolean) =>
  label(t, 'sessionStatus', completed ? 'COMPLETED' : 'IN_PROGRESS')
export const sourceTypeLabel = (
  t: TFunction,
  value: 'EXERCISE' | 'CUSTOM_MACHINE',
) => label(t, 'sourceType', value)
export const trendLabel = (t: TFunction, value: string) =>
  label(t, 'trend', value)
export const dayOfWeekLabel = (t: TFunction, value: WorkoutPlanDayOfWeek) =>
  label(t, 'dayOfWeek', value)
export const ownershipLabel = (t: TFunction, value: WorkoutPlanOwnershipType) =>
  label(t, 'ownership', value)
