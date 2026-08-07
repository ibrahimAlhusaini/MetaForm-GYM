import type { ExerciseSortValue } from '../types/exercise-library.types.js'

export const parseExerciseSort = (
  value: ExerciseSortValue,
): {
  sortBy: 'name' | 'createdAt' | 'updatedAt'
  sortOrder: 'asc' | 'desc'
} => {
  const separator = value.lastIndexOf('-')
  const sortBy = value.slice(0, separator)
  const sortOrder = value.slice(separator + 1)
  if (
    (sortBy === 'name' || sortBy === 'createdAt' || sortBy === 'updatedAt') &&
    (sortOrder === 'asc' || sortOrder === 'desc')
  )
    return { sortBy, sortOrder }
  return { sortBy: 'name', sortOrder: 'asc' }
}

export const optionalSearch = (value: string): string | undefined => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}
