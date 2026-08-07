export interface HealthResponse {
  success: true
  message: string
}

export type {
  BodyWeightPoint,
  BodyWeightTrend,
  BodyWeightTrendDirection,
  DashboardLastWorkout,
  DashboardMuscleGroup,
  DashboardSummaryData,
  DashboardSummaryResponse,
  DashboardWeeklyProgress,
  StrengthPoint,
  StrengthProgressItem,
  StrengthSourceType,
} from './dashboard.js'
export type {
  ExerciseDetail,
  ExerciseDifficultyLevel,
  ExerciseEquipmentType,
  ExerciseFilterOptions,
  ExerciseListItem,
  ExerciseMovementType,
  ExerciseMuscleSubgroup,
  ExerciseOption,
  ExercisePagination,
  ExercisePrimaryMuscle,
} from './exercise-library.js'
export type {
  NutritionActivityLevel,
  NutritionBmiCategory,
  NutritionBmrFormula,
  NutritionCalculationData,
  NutritionCalculationRequest,
  NutritionCalculationResponse,
  NutritionCalculationResults,
  NutritionFitnessGoal,
  NutritionGender,
  NutritionHistoryItem,
  NutritionHistoryResults,
  NutritionHistoryResponse,
  NutritionInputSource,
  NutritionLatestResponse,
  NutritionMethodology,
  NutritionPagination,
  NutritionProfileInputs,
  NutritionProfileInputsResponse,
  NutritionResolvedInputs,
} from './nutrition.js'
