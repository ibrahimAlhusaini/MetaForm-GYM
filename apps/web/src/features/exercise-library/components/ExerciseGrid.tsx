import type { ExerciseListItem } from '@metaform/shared-types'
import { ExerciseCard } from './ExerciseCard.js'

export function ExerciseGrid({ items }: { items: ExerciseListItem[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </div>
  )
}
