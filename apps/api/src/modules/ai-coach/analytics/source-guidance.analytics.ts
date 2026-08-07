export type PlateauClassification =
  'INSUFFICIENT_DATA' | 'PROGRESSING' | 'POSSIBLE_PLATEAU' | 'STABLE'
export type NextWorkoutClassification =
  | 'INSUFFICIENT_DATA'
  | 'CONSIDER_SMALL_PROGRESSION'
  | 'MAINTAIN_LOAD_INCREASE_REPS'
  | 'REPEAT_OR_PRIORITIZE_RECOVERY'

export const analyzePlateau = (weights: number[]) => {
  if (weights.length < 3)
    return {
      classification: 'INSUFFICIENT_DATA' as const,
      qualifyingSessions: weights.length,
      consecutiveWithoutProgress: 0,
    }
  let record = weights[0] ?? 0
  let lastRecordIndex = 0
  weights.forEach((weight, index) => {
    if (weight > record + 0.01) {
      record = weight
      lastRecordIndex = index
    }
  })
  const latest = weights.at(-1) ?? 0
  const priorRecord = Math.max(...weights.slice(0, -1))
  const consecutiveWithoutProgress = weights.length - 1 - lastRecordIndex
  const recent = weights.slice(-4)
  const flatRange = Math.max(...recent) - Math.min(...recent) <= 0.5
  const classification: PlateauClassification =
    latest > priorRecord + 0.01
      ? 'PROGRESSING'
      : recent.length === 4 && flatRange && consecutiveWithoutProgress >= 3
        ? 'POSSIBLE_PLATEAU'
        : 'STABLE'
  return {
    classification,
    qualifyingSessions: weights.length,
    consecutiveWithoutProgress,
    latestRepresentativeWeightKg: latest,
    personalRecordKg: Math.max(...weights),
  }
}

export const classifyNextWorkout = (
  weights: number[],
): NextWorkoutClassification => {
  if (weights.length < 2) return 'INSUFFICIENT_DATA'
  const latest = weights.at(-1) ?? 0
  const previous = weights.at(-2) ?? 0
  if (latest > previous + 0.01) return 'CONSIDER_SMALL_PROGRESSION'
  if (latest < previous - 0.01) return 'REPEAT_OR_PRIORITIZE_RECOVERY'
  return 'MAINTAIN_LOAD_INCREASE_REPS'
}
