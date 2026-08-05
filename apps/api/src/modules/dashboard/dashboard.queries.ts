import { prisma } from '../../config/prisma.js'
import {
  STRENGTH_ITEM_LIMIT,
  STRENGTH_POINT_LIMIT,
} from './dashboard.constants.js'
import type { NumericValue, StrengthQueryRow } from './dashboard.types.js'

interface StreakQueryRow {
  streak: NumericValue
}

export const queryCurrentWorkoutStreak = async (
  userId: string,
  todayUtcDate: string,
): Promise<NumericValue> => {
  const rows = await prisma.$queryRaw<StreakQueryRow[]>`
    WITH RECURSIVE workout_days AS (
      SELECT DISTINCT ("completedAt" AT TIME ZONE 'UTC')::date AS workout_day
      FROM "WorkoutSession"
      WHERE "userId" = ${userId}::uuid
        AND "completedAt" IS NOT NULL
        AND ("completedAt" AT TIME ZONE 'UTC')::date <= ${todayUtcDate}::date
    ),
    anchor_day AS (
      SELECT MAX(workout_day) AS workout_day
      FROM workout_days
    ),
    streak_days(workout_day) AS (
      SELECT workout_day
      FROM anchor_day
      WHERE workout_day IN (
        ${todayUtcDate}::date,
        (${todayUtcDate}::date - 1)
      )

      UNION ALL

      SELECT streak_days.workout_day - 1
      FROM streak_days
      WHERE EXISTS (
        SELECT 1
        FROM workout_days
        WHERE workout_days.workout_day = streak_days.workout_day - 1
      )
    )
    SELECT COUNT(*)::int AS streak
    FROM streak_days
  `

  return rows[0]?.streak ?? 0
}

export const queryStrengthProgress = async (
  userId: string,
): Promise<StrengthQueryRow[]> =>
  prisma.$queryRaw<StrengthQueryRow[]>`
    WITH qualified_sets AS (
      SELECT
        'EXERCISE'::text AS source_type,
        exercise_log."exerciseId" AS source_id,
        workout_session.id AS session_id,
        workout_session."completedAt" AS completed_at,
        exercise_set."weightKg" AS weight_kg
      FROM "WorkoutSession" workout_session
      JOIN "ExerciseLog" exercise_log
        ON exercise_log."workoutSessionId" = workout_session.id
      JOIN "ExerciseSet" exercise_set
        ON exercise_set."exerciseLogId" = exercise_log.id
      WHERE workout_session."userId" = ${userId}::uuid
        AND workout_session."completedAt" IS NOT NULL
        AND exercise_log."exerciseId" IS NOT NULL
        AND exercise_log."customMachineId" IS NULL
        AND exercise_set."weightKg" IS NOT NULL
        AND exercise_set."isWarmup" = false

      UNION ALL

      SELECT
        'CUSTOM_MACHINE'::text AS source_type,
        custom_machine.id AS source_id,
        workout_session.id AS session_id,
        workout_session."completedAt" AS completed_at,
        exercise_set."weightKg" AS weight_kg
      FROM "WorkoutSession" workout_session
      JOIN "ExerciseLog" exercise_log
        ON exercise_log."workoutSessionId" = workout_session.id
      JOIN "CustomMachine" custom_machine
        ON custom_machine.id = exercise_log."customMachineId"
        AND custom_machine."userId" = ${userId}::uuid
      JOIN "ExerciseSet" exercise_set
        ON exercise_set."exerciseLogId" = exercise_log.id
      WHERE workout_session."userId" = ${userId}::uuid
        AND workout_session."completedAt" IS NOT NULL
        AND exercise_log."customMachineId" IS NOT NULL
        AND exercise_log."exerciseId" IS NULL
        AND exercise_set."weightKg" IS NOT NULL
        AND exercise_set."isWarmup" = false
    ),
    session_points AS (
      SELECT
        source_type,
        source_id,
        session_id,
        completed_at,
        MAX(weight_kg)::double precision AS weight_kg
      FROM qualified_sets
      GROUP BY source_type, source_id, session_id, completed_at
    ),
    source_summary AS (
      SELECT
        source_type,
        source_id,
        MAX(completed_at) AS most_recent_at,
        MAX(weight_kg)::double precision AS personal_record_kg,
        COUNT(*)::int AS total_sessions
      FROM session_points
      GROUP BY source_type, source_id
    ),
    ranked_sources AS (
      SELECT
        source_summary.*,
        ROW_NUMBER() OVER (
          ORDER BY most_recent_at DESC, source_type, source_id
        ) AS source_rank
      FROM source_summary
    ),
    ranked_points AS (
      SELECT
        session_points.*,
        ROW_NUMBER() OVER (
          PARTITION BY source_type, source_id
          ORDER BY completed_at DESC, session_id DESC
        ) AS point_rank
      FROM session_points
    )
    SELECT
      ranked_sources.source_type AS "sourceType",
      ranked_sources.source_id AS "sourceId",
      COALESCE(exercise.name, custom_machine.name) AS name,
      COALESCE(exercise."thumbnailUrl", custom_machine."imageUrl") AS "imageUrl",
      COALESCE(
        exercise."primaryMuscle"::text,
        custom_machine."targetMuscle"::text
      ) AS "targetMuscle",
      ranked_sources.personal_record_kg AS "personalRecordKg",
      ranked_sources.total_sessions AS "totalSessions",
      ranked_points.completed_at AS "completedAt",
      ranked_points.weight_kg AS "weightKg"
    FROM ranked_sources
    JOIN ranked_points
      ON ranked_points.source_type = ranked_sources.source_type
      AND ranked_points.source_id = ranked_sources.source_id
    LEFT JOIN "Exercise" exercise
      ON ranked_sources.source_type = 'EXERCISE'
      AND exercise.id = ranked_sources.source_id
    LEFT JOIN "CustomMachine" custom_machine
      ON ranked_sources.source_type = 'CUSTOM_MACHINE'
      AND custom_machine.id = ranked_sources.source_id
      AND custom_machine."userId" = ${userId}::uuid
    WHERE ranked_sources.source_rank <= ${STRENGTH_ITEM_LIMIT}
      AND ranked_points.point_rank <= ${STRENGTH_POINT_LIMIT}
    ORDER BY
      ranked_sources.source_rank,
      ranked_points.completed_at ASC,
      ranked_points.session_id ASC
  `
