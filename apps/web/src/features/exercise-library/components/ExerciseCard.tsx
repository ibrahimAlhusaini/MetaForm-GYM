import type { ExerciseListItem } from '@metaform/shared-types'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  difficultyLabel,
  equipmentLabel,
  movementLabel,
  primaryMuscleLabel,
  recommendationLabel,
  subgroupLabel,
} from '../utils/exercise-formatters.js'
import { ExerciseMedia } from './ExerciseMedia.js'

export function ExerciseCard({ exercise }: { exercise: ExerciseListItem }) {
  const { t } = useTranslation('exerciseLibrary')
  const recommendation = recommendationLabel(
    exercise.recommendedSets,
    exercise.recommendedReps,
  )
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111315] transition hover:border-lime-300/30">
      <ExerciseMedia
        src={exercise.thumbnailUrl}
        alt={t('list.imageAlt', { name: exercise.name })}
        className="aspect-[16/9] w-full"
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-lime-300/10 px-2.5 py-1 font-semibold text-lime-300">
            {primaryMuscleLabel(exercise.primaryMuscle)}
          </span>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-zinc-300">
            {difficultyLabel(exercise.difficultyLevel)}
          </span>
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">
          <Link
            to={`/app/exercises/${exercise.id}`}
            className="rounded-sm outline-none before:absolute focus-visible:ring-2 focus-visible:ring-lime-300"
          >
            {exercise.name}
          </Link>
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <div>
            <dt className="text-zinc-500">{t('list.subgroup')}</dt>
            <dd className="text-zinc-200">
              {subgroupLabel(exercise.muscleSubgroup)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">{t('list.equipment')}</dt>
            <dd className="text-zinc-200">
              {equipmentLabel(exercise.equipmentType)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">{t('list.movement')}</dt>
            <dd className="text-zinc-200">
              {movementLabel(exercise.movementType)}
            </dd>
          </div>
          {recommendation ? (
            <div>
              <dt className="text-zinc-500">{t('list.target')}</dt>
              <dd className="text-zinc-200">{recommendation}</dd>
            </div>
          ) : null}
        </dl>
        <Link
          to={`/app/exercises/${exercise.id}`}
          aria-label={t('list.viewLabel', { name: exercise.name })}
          className="mt-5 inline-flex min-h-10 items-center gap-2 self-start rounded-lg font-semibold text-lime-300 outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
        >
          {t('list.view')}{' '}
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
