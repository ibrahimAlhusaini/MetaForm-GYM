export const EXERCISE_PAGE_SIZE = 12
export const EXERCISE_OPTION_LIMIT = 20
export const EXERCISE_SEARCH_DEBOUNCE_MS = 300

export const exerciseSortOptions = [
  { value: 'name-asc', labelKey: 'sort.nameAsc' },
  { value: 'name-desc', labelKey: 'sort.nameDesc' },
  { value: 'updatedAt-desc', labelKey: 'sort.updatedDesc' },
  { value: 'createdAt-desc', labelKey: 'sort.createdDesc' },
] as const
