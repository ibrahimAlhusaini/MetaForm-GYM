import type { WorkoutPlanQuery } from '../types/workout-plans.types.js'

export const PLAN_PAGE_SIZE = 12

export const cleanPlanQuery = (query: WorkoutPlanQuery): WorkoutPlanQuery => ({
  page: query.page,
  limit: query.limit,
  sortBy: query.sortBy,
  sortOrder: query.sortOrder,
  ...(query.search?.trim() ? { search: query.search.trim() } : {}),
  ...(query.difficultyLevel ? { difficultyLevel: query.difficultyLevel } : {}),
  ...(query.isTemplate === undefined ? {} : { isTemplate: query.isTemplate }),
  ...(query.ownership ? { ownership: query.ownership } : {}),
})
