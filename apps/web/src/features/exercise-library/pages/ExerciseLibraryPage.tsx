import { useMemo, useState } from 'react'
import {
  ExerciseEmptyState,
  ExerciseLibraryErrorState,
  ExerciseLibrarySkeleton,
} from '../components/ExerciseLibraryStates.js'
import { ExerciseFilters } from '../components/ExerciseFilters.js'
import { ExerciseGrid } from '../components/ExerciseGrid.js'
import { ExercisePagination } from '../components/ExercisePagination.js'
import { EXERCISE_PAGE_SIZE } from '../constants/exercise-library.constants.js'
import { useExerciseFilterOptions } from '../hooks/useExerciseFilterOptions.js'
import { useExerciseList } from '../hooks/useExerciseList.js'
import type {
  ExerciseFilterState,
  ExerciseSortValue,
} from '../types/exercise-library.types.js'
import { optionalSearch, parseExerciseSort } from '../utils/exercise-query.js'

const initialFilters: ExerciseFilterState = {
  primaryMuscle: undefined,
  muscleSubgroup: undefined,
  equipmentType: undefined,
  difficultyLevel: undefined,
  movementType: undefined,
  sort: 'name-asc',
}

const sortValues: ExerciseSortValue[] = [
  'name-asc',
  'name-desc',
  'updatedAt-desc',
  'createdAt-desc',
]

export function ExerciseLibraryPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState<string | undefined>()
  const [filters, setFilters] = useState<ExerciseFilterState>(initialFilters)
  const [page, setPage] = useState(1)
  const filterOptions = useExerciseFilterOptions()
  const sort = parseExerciseSort(filters.sort)
  const query = useMemo(
    () => ({
      page,
      limit: EXERCISE_PAGE_SIZE,
      ...sort,
      ...(search ? { search } : {}),
      ...(filters.primaryMuscle
        ? { primaryMuscle: filters.primaryMuscle }
        : {}),
      ...(filters.muscleSubgroup
        ? { muscleSubgroup: filters.muscleSubgroup }
        : {}),
      ...(filters.equipmentType
        ? { equipmentType: filters.equipmentType }
        : {}),
      ...(filters.difficultyLevel
        ? { difficultyLevel: filters.difficultyLevel }
        : {}),
      ...(filters.movementType ? { movementType: filters.movementType } : {}),
    }),
    [filters, page, search, sort.sortBy, sort.sortOrder],
  )
  const exercises = useExerciseList(query)

  const changeFilter = (field: keyof ExerciseFilterState, rawValue: string) => {
    if (filterOptions.state.status !== 'success') return
    const options = filterOptions.state.data
    setPage(1)
    setFilters((current) => {
      if (field === 'primaryMuscle') {
        const value = options.primaryMuscles.find((item) => item === rawValue)
        return { ...current, primaryMuscle: value, muscleSubgroup: undefined }
      }
      if (field === 'muscleSubgroup')
        return {
          ...current,
          muscleSubgroup: options.muscleSubgroups.find(
            (item) => item === rawValue,
          ),
        }
      if (field === 'equipmentType')
        return {
          ...current,
          equipmentType: options.equipmentTypes.find(
            (item) => item === rawValue,
          ),
        }
      if (field === 'difficultyLevel')
        return {
          ...current,
          difficultyLevel: options.difficultyLevels.find(
            (item) => item === rawValue,
          ),
        }
      if (field === 'movementType')
        return {
          ...current,
          movementType: options.movementTypes.find((item) => item === rawValue),
        }
      const sortValue = sortValues.find((value) => value === rawValue)
      return { ...current, sort: sortValue ?? 'name-asc' }
    })
  }
  const clearFilters = () => {
    setSearchInput('')
    setSearch(undefined)
    setFilters(initialFilters)
    setPage(1)
  }
  const hasFilters = [
    search,
    filters.primaryMuscle,
    filters.muscleSubgroup,
    filters.equipmentType,
    filters.difficultyLevel,
    filters.movementType,
  ].some((value) => value !== undefined)

  return (
    <div>
      <header>
        <p className="text-sm font-semibold tracking-[.18em] text-lime-300 uppercase">
          Movement knowledge
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Exercise Library
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
          Explore published exercises, refine by training focus, and open clear
          movement guidance.
        </p>
      </header>
      <div className="mt-8">
        {filterOptions.state.status === 'loading' ? (
          <ExerciseLibrarySkeleton label="Loading exercise filters" />
        ) : null}
        {filterOptions.state.status === 'error' ? (
          <ExerciseLibraryErrorState
            message={filterOptions.state.errorMessage}
            onRetry={filterOptions.retry}
          />
        ) : null}
        {filterOptions.state.status === 'success' ? (
          <ExerciseFilters
            options={filterOptions.state.data}
            filters={filters}
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            onSearch={() => {
              setSearch(optionalSearch(searchInput))
              setPage(1)
            }}
            onFilterChange={changeFilter}
            onClear={clearFilters}
          />
        ) : null}
      </div>
      <div
        className="mt-7"
        aria-live="polite"
        aria-busy={exercises.state.status === 'loading'}
      >
        {exercises.state.status === 'loading' ? (
          <ExerciseLibrarySkeleton label="Loading published exercises" />
        ) : null}
        {exercises.state.status === 'error' ? (
          <ExerciseLibraryErrorState
            message={exercises.state.errorMessage}
            onRetry={exercises.retry}
          />
        ) : null}
        {exercises.state.status === 'success' &&
        exercises.state.data.items.length === 0 ? (
          <ExerciseEmptyState filtered={hasFilters} />
        ) : null}
        {exercises.state.status === 'success' &&
        exercises.state.data.items.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-zinc-400">
              {exercises.state.data.pagination.totalItems} published{' '}
              {exercises.state.data.pagination.totalItems === 1
                ? 'exercise'
                : 'exercises'}
            </p>
            <ExerciseGrid items={exercises.state.data.items} />
            <ExercisePagination
              pagination={exercises.state.data.pagination}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
