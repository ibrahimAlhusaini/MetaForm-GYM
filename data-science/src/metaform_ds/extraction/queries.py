"""Explicit SELECT-only PostgreSQL queries matching Prisma's quoted names."""

BODY_WEIGHT_SQL = """
SELECT
  measurement."userId"::text AS user_id,
  measurement."measuredAt" AS measured_at,
  measurement."weightKg" AS weight_kg,
  profile."heightCm" AS height_cm,
  profile."fitnessGoal"::text AS fitness_goal,
  profile."activityLevel"::text AS activity_level
FROM "BodyMeasurement" AS measurement
LEFT JOIN "Profile" AS profile ON profile."userId" = measurement."userId"
WHERE (CAST(:date_from AS timestamptz) IS NULL
       OR measurement."measuredAt" >= CAST(:date_from AS timestamptz))
  AND (CAST(:date_to AS timestamptz) IS NULL
       OR measurement."measuredAt" <= CAST(:date_to AS timestamptz))
ORDER BY measurement."userId", measurement."measuredAt", measurement.id
"""

STRENGTH_PROGRESSION_SQL = """
WITH qualified_sets AS (
  SELECT
    session."userId"::text AS user_id,
    session.id::text AS session_id,
    session."completedAt" AS session_date,
    'EXERCISE'::text AS source_type,
    log."exerciseId"::text AS source_id,
    exercise.name AS source_name,
    exercise."primaryMuscle"::text AS primary_muscle,
    exercise."equipmentType"::text AS equipment_type,
    set_row."weightKg" AS weight_kg,
    set_row.reps
  FROM "WorkoutSession" AS session
  JOIN "ExerciseLog" AS log ON log."workoutSessionId" = session.id
  JOIN "Exercise" AS exercise ON exercise.id = log."exerciseId"
  JOIN "ExerciseSet" AS set_row ON set_row."exerciseLogId" = log.id
  WHERE session."completedAt" IS NOT NULL
    AND log."exerciseId" IS NOT NULL
    AND log."customMachineId" IS NULL
    AND set_row."isWarmup" = false
    AND set_row."weightKg" IS NOT NULL
    AND (CAST(:date_from AS timestamptz) IS NULL
         OR session."completedAt" >= CAST(:date_from AS timestamptz))
    AND (CAST(:date_to AS timestamptz) IS NULL
         OR session."completedAt" <= CAST(:date_to AS timestamptz))
  UNION ALL
  SELECT
    session."userId"::text,
    session.id::text,
    session."completedAt",
    'CUSTOM_MACHINE'::text,
    machine.id::text,
    NULL::text,
    NULL::text,
    NULL::text,
    set_row."weightKg",
    set_row.reps
  FROM "WorkoutSession" AS session
  JOIN "ExerciseLog" AS log ON log."workoutSessionId" = session.id
  JOIN "CustomMachine" AS machine
    ON machine.id = log."customMachineId" AND machine."userId" = session."userId"
  JOIN "ExerciseSet" AS set_row ON set_row."exerciseLogId" = log.id
  WHERE session."completedAt" IS NOT NULL
    AND log."customMachineId" IS NOT NULL
    AND log."exerciseId" IS NULL
    AND set_row."isWarmup" = false
    AND set_row."weightKg" IS NOT NULL
    AND (CAST(:date_from AS timestamptz) IS NULL
         OR session."completedAt" >= CAST(:date_from AS timestamptz))
    AND (CAST(:date_to AS timestamptz) IS NULL
         OR session."completedAt" <= CAST(:date_to AS timestamptz))
), session_maximum AS (
  SELECT user_id, session_id, session_date, source_type, source_id,
         MAX(weight_kg) AS max_weight_kg
  FROM qualified_sets
  GROUP BY user_id, session_id, session_date, source_type, source_id
)
SELECT
  maximum.user_id,
  maximum.session_id,
  maximum.session_date,
  maximum.source_type,
  maximum.source_id,
  MAX(qualified.source_name) AS source_name,
  maximum.max_weight_kg,
  MAX(qualified.reps) FILTER (
    WHERE qualified.weight_kg = maximum.max_weight_kg
  ) AS max_reps_at_max_weight,
  COALESCE(SUM(qualified.weight_kg * qualified.reps), 0) AS total_volume_kg,
  COUNT(*)::int AS working_set_count,
  MAX(qualified.primary_muscle) AS primary_muscle,
  MAX(qualified.equipment_type) AS equipment_type
FROM session_maximum AS maximum
JOIN qualified_sets AS qualified
  ON qualified.user_id = maximum.user_id
 AND qualified.session_id = maximum.session_id
 AND qualified.source_type = maximum.source_type
 AND qualified.source_id = maximum.source_id
GROUP BY maximum.user_id, maximum.session_id, maximum.session_date,
         maximum.source_type, maximum.source_id, maximum.max_weight_kg
ORDER BY maximum.user_id, maximum.source_type, maximum.source_id,
         maximum.session_date, maximum.session_id
"""

WORKOUT_ACTIVITY_SQL = """
SELECT
  session."userId"::text AS user_id,
  session.id::text AS session_id,
  COALESCE(session."completedAt", session."startedAt") AS session_date,
  (session."completedAt" IS NOT NULL) AS completed,
  CASE WHEN session."completedAt" IS NULL THEN NULL
       ELSE FLOOR(EXTRACT(EPOCH FROM
            (session."completedAt" - session."startedAt")) / 60.0)
  END AS duration_minutes,
  COUNT(DISTINCT log.id)::int AS exercise_count,
  COUNT(set_row.id) FILTER (WHERE set_row."isWarmup" = false)::int
    AS working_set_count,
  COALESCE(SUM(set_row."weightKg" * set_row.reps) FILTER (
    WHERE set_row."isWarmup" = false
      AND set_row."weightKg" IS NOT NULL AND set_row.reps IS NOT NULL
  ), 0) AS total_volume_kg,
  (session."workoutPlanId" IS NOT NULL) AS workout_plan_used
FROM "WorkoutSession" AS session
LEFT JOIN "ExerciseLog" AS log ON log."workoutSessionId" = session.id
LEFT JOIN "ExerciseSet" AS set_row ON set_row."exerciseLogId" = log.id
WHERE (:include_incomplete OR session."completedAt" IS NOT NULL)
  AND (CAST(:date_from AS timestamptz) IS NULL
       OR session."startedAt" >= CAST(:date_from AS timestamptz))
  AND (CAST(:date_to AS timestamptz) IS NULL
       OR session."startedAt" <= CAST(:date_to AS timestamptz))
GROUP BY session.id
ORDER BY session."userId", session."completedAt" NULLS LAST,
         session."startedAt", session.id
"""

NUTRITION_SQL = """
SELECT
  calculation."userId"::text AS user_id,
  calculation."calculatedAt" AS calculated_at,
  calculation."weightKg" AS weight_kg_used,
  calculation."fitnessGoal"::text AS fitness_goal,
  calculation."activityLevel"::text AS activity_level,
  calculation."maintenanceCalories" AS maintenance_calories,
  calculation."recommendedCalories" AS recommended_calories,
  calculation."proteinGrams" AS protein_grams,
  calculation."carbohydrateGrams" AS carbohydrate_grams,
  calculation."fatGrams" AS fat_grams,
  calculation."waterLiters" AS water_liters,
  calculation."calculationVersion" AS calculation_version
FROM "NutritionCalculation" AS calculation
WHERE (CAST(:date_from AS timestamptz) IS NULL
       OR calculation."calculatedAt" >= CAST(:date_from AS timestamptz))
  AND (CAST(:date_to AS timestamptz) IS NULL
       OR calculation."calculatedAt" <= CAST(:date_to AS timestamptz))
ORDER BY calculation."userId", calculation."calculatedAt", calculation.id
"""

USER_FITNESS_CONTEXT_SQL = """
SELECT
  profile."userId"::text AS user_id,
  profile."birthDate" AS birth_date,
  profile.gender::text AS gender,
  profile."heightCm" AS height_cm,
  profile."currentWeightKg" AS current_weight_kg,
  profile."activityLevel"::text AS activity_level,
  profile."fitnessGoal"::text AS fitness_goal
FROM "Profile" AS profile
ORDER BY profile."userId"
"""
