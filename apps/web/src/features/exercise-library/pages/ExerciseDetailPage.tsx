import { ArrowLeft, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { Link, useParams } from 'react-router'
import {
  ExerciseLibraryErrorState,
  ExerciseLibrarySkeleton,
} from '../components/ExerciseLibraryStates.js'
import { ExerciseMedia } from '../components/ExerciseMedia.js'
import { ExerciseVideo } from '../components/ExerciseVideo.js'
import { useExerciseDetail } from '../hooks/useExerciseDetail.js'
import {
  difficultyLabel,
  equipmentLabel,
  movementLabel,
  primaryMuscleLabel,
  recommendationLabel,
  subgroupLabel,
} from '../utils/exercise-formatters.js'

export function ExerciseDetailPage() {
  const { exerciseId = '' } = useParams()
  const resource = useExerciseDetail(exerciseId)
  if (resource.state.status === 'loading')
    return <ExerciseLibrarySkeleton label="Loading exercise details" />
  if (resource.state.status === 'error')
    return (
      <ExerciseLibraryErrorState
        message={resource.state.errorMessage}
        onRetry={resource.retry}
      />
    )
  const exercise = resource.state.data
  const recommendation = recommendationLabel(
    exercise.recommendedSets,
    exercise.recommendedReps,
  )
  return (
    <article>
      <Link
        to="/app/exercises"
        className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-lime-300 outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to Exercise
        Library
      </Link>
      <header className="mt-5">
        <p className="text-sm font-semibold tracking-[.18em] text-lime-300 uppercase">
          {primaryMuscleLabel(exercise.primaryMuscle)}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          {exercise.name}
        </h1>
        {exercise.description ? (
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-400">
            {exercise.description}
          </p>
        ) : null}
      </header>
      <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.75fr)]">
        <div className="space-y-5">
          <ExerciseVideo
            name={exercise.name}
            videoUrl={exercise.videoUrl}
            thumbnailUrl={exercise.thumbnailUrl}
          />
          <ExerciseMedia
            src={exercise.thumbnailUrl}
            alt={`${exercise.name} reference position`}
            className="max-h-80 w-full rounded-2xl"
          />
        </div>
        <section
          aria-labelledby="classification-heading"
          className="rounded-2xl border border-white/10 bg-[#111315] p-6"
        >
          <h2 id="classification-heading" className="text-xl font-semibold">
            Exercise profile
          </h2>
          <dl className="mt-5 grid grid-cols-2 gap-5 text-sm">
            <DetailFact
              label="Primary muscle"
              value={primaryMuscleLabel(exercise.primaryMuscle)}
            />
            <DetailFact
              label="Subgroup"
              value={subgroupLabel(exercise.muscleSubgroup)}
            />
            <DetailFact
              label="Equipment"
              value={equipmentLabel(exercise.equipmentType)}
            />
            <DetailFact
              label="Difficulty"
              value={difficultyLabel(exercise.difficultyLevel)}
            />
            <DetailFact
              label="Movement"
              value={movementLabel(exercise.movementType)}
            />
            <DetailFact
              label="Recommended"
              value={recommendation ?? 'Not specified'}
            />
          </dl>
          <div className="mt-6 border-t border-white/10 pt-5">
            <h3 className="text-sm font-medium text-zinc-500">
              Secondary muscles
            </h3>
            <p className="mt-2 text-zinc-200">
              {exercise.secondaryMuscles.length > 0
                ? exercise.secondaryMuscles.map(primaryMuscleLabel).join(', ')
                : 'None specified'}
            </p>
          </div>
        </section>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ContentList
          title="Instructions"
          items={exercise.instructions}
          ordered
          icon="check"
          empty="No written instructions are available for this exercise."
        />
        <ContentList
          title="Common mistakes"
          items={exercise.commonMistakes}
          icon="warning"
          empty="No common mistakes have been documented."
        />
      </div>
    </article>
  )
}

function DetailFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="mt-1 font-medium text-zinc-100">{value}</dd>
    </div>
  )
}

function ContentList({
  title,
  items,
  ordered = false,
  icon,
  empty,
}: {
  title: string
  items: string[]
  ordered?: boolean
  icon: 'check' | 'warning'
  empty: string
}) {
  const Icon = icon === 'check' ? CheckCircle2 : TriangleAlert
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111315] p-6">
      <h2 className="flex items-center gap-3 text-xl font-semibold">
        <Icon className="size-5 text-lime-300" aria-hidden="true" />
        {title}
      </h2>
      {items.length > 0 ? (
        ordered ? (
          <ol className="mt-5 list-decimal space-y-3 pl-5 leading-7 text-zinc-300">
            {items.map((item, index) => (
              <li key={`${String(index)}-${item}`}>{item}</li>
            ))}
          </ol>
        ) : (
          <ul className="mt-5 list-disc space-y-3 pl-5 leading-7 text-zinc-300">
            {items.map((item, index) => (
              <li key={`${String(index)}-${item}`}>{item}</li>
            ))}
          </ul>
        )
      ) : (
        <p className="mt-5 flex gap-2 text-zinc-400">
          <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          {empty}
        </p>
      )}
    </section>
  )
}
