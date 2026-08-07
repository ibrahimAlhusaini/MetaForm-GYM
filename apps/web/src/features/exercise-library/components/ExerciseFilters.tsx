import type { ExerciseFilterOptions } from '@metaform/shared-types'
import { RotateCcw, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ExerciseFilterState } from '../types/exercise-library.types.js'
import {
  difficultyLabel,
  equipmentLabel,
  movementLabel,
  primaryMuscleLabel,
  subgroupLabel,
} from '../utils/exercise-formatters.js'
import { exerciseSortOptions } from '../constants/exercise-library.constants.js'

const selectClass =
  'mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3 outline-none focus:border-lime-300 focus:ring-2 focus:ring-lime-300/15'

export function ExerciseFilters({
  options,
  filters,
  searchInput,
  onSearchInputChange,
  onSearch,
  onFilterChange,
  onClear,
}: {
  options: ExerciseFilterOptions
  filters: ExerciseFilterState
  searchInput: string
  onSearchInputChange: (value: string) => void
  onSearch: () => void
  onFilterChange: (field: keyof ExerciseFilterState, value: string) => void
  onClear: () => void
}) {
  const { t } = useTranslation(['exerciseLibrary', 'common'])
  const subgroupOptions = filters.primaryMuscle
    ? options.muscleSubgroupsByPrimaryMuscle[filters.primaryMuscle]
    : []
  return (
    <section
      aria-label={t('exerciseLibrary:filters.label')}
      className="rounded-2xl border border-white/10 bg-[#111315] p-4 sm:p-5"
    >
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          onSearch()
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <label className="flex-1 text-sm font-medium">
          {t('exerciseLibrary:filters.searchLabel')}
          <span className="mt-2 flex rounded-xl border border-white/10 bg-[#151719] focus-within:border-lime-300 focus-within:ring-2 focus-within:ring-lime-300/15">
            <Search
              className="ms-3 size-5 self-center text-zinc-500"
              aria-hidden="true"
            />
            <input
              value={searchInput}
              onChange={(event) => {
                onSearchInputChange(event.target.value)
              }}
              placeholder={t('exerciseLibrary:filters.searchPlaceholder')}
              className="min-h-11 w-full bg-transparent px-3 outline-none placeholder:text-zinc-600"
            />
          </span>
        </label>
        <button
          type="submit"
          className="min-h-11 self-end rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950"
        >
          {t('common:actions.search')}
        </button>
      </form>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <FilterSelect
          label={t('exerciseLibrary:filters.primaryMuscle')}
          value={filters.primaryMuscle ?? ''}
          onChange={(value) => {
            onFilterChange('primaryMuscle', value)
          }}
        >
          <option value="">{t('exerciseLibrary:filters.allMuscles')}</option>
          {options.primaryMuscles.map((value) => (
            <option key={value} value={value}>
              {primaryMuscleLabel(value)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label={t('exerciseLibrary:filters.subgroup')}
          value={filters.muscleSubgroup ?? ''}
          disabled={!filters.primaryMuscle}
          onChange={(value) => {
            onFilterChange('muscleSubgroup', value)
          }}
        >
          <option value="">
            {filters.primaryMuscle
              ? t('exerciseLibrary:filters.allSubgroups')
              : t('exerciseLibrary:filters.chooseMuscle')}
          </option>
          {subgroupOptions.map((value) => (
            <option key={value} value={value}>
              {subgroupLabel(value)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label={t('exerciseLibrary:filters.equipment')}
          value={filters.equipmentType ?? ''}
          onChange={(value) => {
            onFilterChange('equipmentType', value)
          }}
        >
          <option value="">{t('exerciseLibrary:filters.allEquipment')}</option>
          {options.equipmentTypes.map((value) => (
            <option key={value} value={value}>
              {equipmentLabel(value)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label={t('exerciseLibrary:filters.difficulty')}
          value={filters.difficultyLevel ?? ''}
          onChange={(value) => {
            onFilterChange('difficultyLevel', value)
          }}
        >
          <option value="">{t('exerciseLibrary:filters.allLevels')}</option>
          {options.difficultyLevels.map((value) => (
            <option key={value} value={value}>
              {difficultyLabel(value)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label={t('exerciseLibrary:filters.movement')}
          value={filters.movementType ?? ''}
          onChange={(value) => {
            onFilterChange('movementType', value)
          }}
        >
          <option value="">{t('exerciseLibrary:filters.allMovements')}</option>
          {options.movementTypes.map((value) => (
            <option key={value} value={value}>
              {movementLabel(value)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label={t('exerciseLibrary:filters.sort')}
          value={filters.sort}
          onChange={(value) => {
            onFilterChange('sort', value)
          }}
        >
          {exerciseSortOptions.map(({ value, labelKey }) => (
            <option key={value} value={value}>
              {t(`exerciseLibrary:${labelKey}`)}
            </option>
          ))}
        </FilterSelect>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-zinc-300 outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
      >
        <RotateCcw className="size-4" aria-hidden="true" />{' '}
        {t('common:actions.clearFilters')}
      </button>
    </section>
  )
}

function FilterSelect({
  label,
  value,
  disabled = false,
  onChange,
  children,
}: {
  label: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {children}
      </select>
    </label>
  )
}
