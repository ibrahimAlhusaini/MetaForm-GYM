import type { ExerciseDifficultyLevel } from '@metaform/shared-types'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { difficultyLabel } from '../../../i18n/enum-labels.js'
import type { PlanFiltersState } from '../types/workout-plans.types.js'

const difficulties: ExerciseDifficultyLevel[] = [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
]
const sortValues: PlanFiltersState['sortBy'][] = [
  'updatedAt',
  'createdAt',
  'name',
]

export function WorkoutPlanFilters({
  value,
  mine,
  onChange,
}: {
  value: PlanFiltersState
  mine: boolean
  onChange: (value: PlanFiltersState) => void
}) {
  const { t } = useTranslation(['workoutPlans', 'common'])
  const update = <K extends keyof PlanFiltersState>(
    key: K,
    next: PlanFiltersState[K],
  ) => {
    onChange({ ...value, [key]: next })
  }
  return (
    <fieldset className="rounded-2xl border border-white/10 bg-[#111315] p-4 sm:p-5">
      <legend className="px-2 text-sm font-semibold text-zinc-300">
        {t('workoutPlans:filters.label')}
      </legend>
      <div className="grid gap-3 lg:grid-cols-[minmax(15rem,1fr)_repeat(4,minmax(9rem,auto))_auto]">
        <label className="relative block text-sm">
          <span className="sr-only">{t('workoutPlans:filters.search')}</span>
          <Search className="pointer-events-none absolute start-3 top-3.5 size-4 text-zinc-500" />
          <input
            value={value.search}
            onChange={(event) => {
              update('search', event.target.value)
            }}
            placeholder={t('workoutPlans:filters.placeholder')}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 ps-10 pe-3 outline-none focus:border-lime-300"
          />
        </label>
        <label className="text-sm">
          <span className="sr-only">
            {t('workoutPlans:filters.difficulty')}
          </span>
          <select
            value={value.difficultyLevel}
            onChange={(event) => {
              const difficulty = difficulties.find(
                (item) => item === event.target.value,
              )
              update('difficultyLevel', difficulty ?? '')
            }}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
          >
            <option value="">
              {t('workoutPlans:filters.allDifficulties')}
            </option>
            {difficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficultyLabel(t, difficulty)}
              </option>
            ))}
          </select>
        </label>
        {mine ? (
          <label className="text-sm">
            <span className="sr-only">
              {t('workoutPlans:filters.template')}
            </span>
            <select
              value={value.isTemplate}
              onChange={(event) => {
                const template =
                  event.target.value === 'true' ||
                  event.target.value === 'false'
                    ? event.target.value
                    : ''
                update('isTemplate', template)
              }}
              className="min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
            >
              <option value="">{t('workoutPlans:filters.allTemplates')}</option>
              <option value="true">
                {t('workoutPlans:filters.templatesOnly')}
              </option>
              <option value="false">
                {t('workoutPlans:filters.regularOnly')}
              </option>
            </select>
          </label>
        ) : null}
        <label className="text-sm">
          <span className="sr-only">{t('workoutPlans:filters.sort')}</span>
          <select
            value={value.sortBy}
            onChange={(event) => {
              const sort = sortValues.find(
                (item) => item === event.target.value,
              )
              if (sort) update('sortBy', sort)
            }}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
          >
            <option value="updatedAt">
              {t('workoutPlans:filters.updated')}
            </option>
            <option value="createdAt">
              {t('workoutPlans:filters.created')}
            </option>
            <option value="name">{t('workoutPlans:filters.name')}</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="sr-only">{t('workoutPlans:filters.order')}</span>
          <select
            value={value.sortOrder}
            onChange={(event) => {
              update('sortOrder', event.target.value === 'asc' ? 'asc' : 'desc')
            }}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
          >
            <option value="asc">{t('workoutPlans:filters.ascending')}</option>
            <option value="desc">{t('workoutPlans:filters.descending')}</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            onChange({
              search: '',
              difficultyLevel: '',
              isTemplate: '',
              sortBy: mine ? 'updatedAt' : 'name',
              sortOrder: mine ? 'desc' : 'asc',
            })
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold"
        >
          <X className="size-4" />
          {t('workoutPlans:filters.clear')}
        </button>
      </div>
    </fieldset>
  )
}
