# Home Dashboard Backend API

## Endpoint

`GET /api/v1/dashboard/summary` requires a Bearer access token. The API derives ownership exclusively from the verified token and accepts no dashboard user ID.

```json
{
  "success": true,
  "data": {
    "user": { "firstName": "Example" },
    "overview": {
      "currentBodyWeightKg": 78.5,
      "dailyCalories": null,
      "currentWorkoutStreak": 3,
      "workoutsCompleted": 12,
      "lastWorkout": {
        "id": "uuid",
        "startedAt": "2026-08-05T08:00:00.000Z",
        "completedAt": "2026-08-05T09:04:00.000Z",
        "durationMinutes": 64
      },
      "weeklyProgress": {
        "completedWorkouts": 3,
        "previousWeekCompletedWorkouts": 2,
        "percentageChange": 50
      }
    },
    "bodyWeightProgress": {
      "points": [{ "date": "2026-08-01", "weightKg": 78.5 }],
      "trend": {
        "direction": "INSUFFICIENT_DATA",
        "changeKg": null,
        "percentageChange": null
      }
    },
    "strengthProgress": { "machines": [] },
    "meta": {
      "generatedAt": "2026-08-05T12:00:00.000Z",
      "bodyWeightDataAvailable": true,
      "strengthDataAvailable": false
    }
  }
}
```

The public TypeScript contract lives in `packages/shared-types/src/dashboard.ts` and is independent of Prisma-generated model types.

## Data flow

```mermaid
flowchart LR
    Token[Bearer access token] --> Auth[authenticate middleware]
    Auth -->|authenticated user ID| Controller[dashboard controller]
    Controller --> Service[dashboard service]
    Service --> Profile[(Profile)]
    Service --> Measurements[(BodyMeasurement)]
    Service --> Nutrition[(NutritionCalculation)]
    Service --> Sessions[(WorkoutSession)]
    Sessions --> Logs[(ExerciseLog)]
    Logs --> Sets[(ExerciseSet)]
    Service --> Analytics[Pure analytics helpers]
    Analytics --> Response[Typed summary response]
```

## Metric definitions

### User name

`firstName` is the first non-empty whitespace-delimited token in `Profile.fullName`. It falls back to `Member` only for an absent or malformed historical profile name.

### Current body weight

The latest `BodyMeasurement` by `measuredAt` is authoritative. `Profile.currentWeightKg` is the fallback snapshot. If neither exists, the value is `null`.

### Daily calories

This is the `maintenanceCalories` value from the most recent `NutritionCalculation` by `calculatedAt`. The dashboard does not calculate nutrition values.

### Workout streak

A workout day is a UTC calendar date with at least one `WorkoutSession` whose `completedAt` is non-null. Multiple sessions on one date contribute one day. The streak ends today, or yesterday when today has no completed workout; otherwise it is zero.

The streak is calculated in PostgreSQL with a recursive date query. Only the final integer is returned to Node, so an arbitrarily long streak does not load complete session history into memory.

### Workouts completed and last workout

`workoutsCompleted` counts all completed sessions for the authenticated user. The last workout is the completed session with the greatest `completedAt`. Duration is `(completedAt - startedAt)` floored to whole minutes and clamped to zero for negative malformed history.

### Weekly progress

Weeks are UTC Monday-to-Monday half-open windows. Counts represent completed sessions, not distinct workout days.

- Previous and current both zero: `0%`
- Previous zero and current positive: `null` because relative growth has no denominator
- Otherwise: `((current - previous) / previous) × 100`

Percentage values are signed and rounded to at most two decimal places.

### Body-weight progress

The range contains recorded measurements from the current UTC day and preceding 89 UTC days. It returns one point per measurement in chronological order. Missing dates are not fabricated, interpolated, or carried forward.

Trend compares the first and last returned points:

- Fewer than two points: `INSUFFICIENT_DATA`
- Absolute signed change at or below `0.1 kg`: `STABLE`
- Positive change above tolerance: `INCREASING`
- Negative change below tolerance: `DECREASING`

`changeKg` and `percentageChange` are signed. Direction is descriptive, not positive or negative; goal-aware interpretation belongs to the future frontend.

### Strength progress

Qualifying data follows `WorkoutSession → ExerciseLog → ExerciseSet` and requires:

- a completed session;
- a non-warmup set;
- a non-null weight;
- exactly one valid exercise or user-owned custom-machine source.

For each source and session, the representative load is the maximum qualifying set weight across all matching logs. This measures load progression, not total volume, estimated one-repetition maximum, or training quality.

Exercise IDs and custom-machine IDs form separate source namespaces. Sources with the same display name never merge. Exercise metadata uses `thumbnailUrl` and `primaryMuscle`; machine metadata uses `imageUrl` and `targetMuscle`.

The endpoint returns:

- the 5 sources with the most recent qualifying sessions;
- at most the latest 12 session points per source, reordered chronologically;
- the all-history maximum qualifying load as `personalRecordKg`;
- the all-history distinct qualifying-session count;
- signed latest-versus-previous load and percentage changes.

There is no pagination because this endpoint is a bounded home summary.

## Precision

Prisma Decimal values never enter the JSON response directly. One analytics converter accepts Decimal-like values, verifies finiteness, converts to JavaScript numbers, and rounds weights and percentages to at most two decimal places. Counts and durations are whole numbers. A non-finite internal value is treated as an unexpected server error rather than serialized.

## Empty states

Missing fitness history is not an error. The endpoint returns HTTP 200 with null scalar values, empty series, `INSUFFICIENT_DATA`, and availability flags. Clients should use `meta` and nullability rather than infer availability from HTTP status.

## Query and index strategy

Fixed-count Prisma queries retrieve identity, current snapshots, bounded body points, nutrition, totals, weekly counts, and the last workout. Two isolated Prisma tagged-template queries cover operations Prisma cannot express readably:

- consecutive distinct UTC workout dates;
- ranked, grouped, per-session strength loads.

Values are passed as query parameters. No user input is interpolated into SQL text.

Existing indexes used by these access paths include:

- `BodyMeasurement(userId, measuredAt DESC)`;
- `NutritionCalculation(userId, calculatedAt DESC)`;
- `WorkoutSession(userId, completedAt DESC)`;
- `ExerciseLog(workoutSessionId, orderIndex)`;
- `ExerciseSet(exerciseLogId, setNumber)`;
- `CustomMachine(userId, targetMuscle)`.

No new migration is required. Strength history is aggregated in PostgreSQL and the application receives no more than 60 point rows.

## Security boundaries

- `authenticate` validates the access token and active user before the controller.
- Every query is scoped to the authenticated user ID.
- Custom-machine metadata is owner-joined again inside the strength query.
- No password, refresh-token, access-token, or authentication-session data is selected.
- Raw Prisma/database failures continue through the centralized generic error handler.
- The dashboard does not log private workout or measurement data.

## Testing

Integration tests require a dedicated database whose name ends in `_test`. Existing migrations must be deployed there first. Test cleanup explicitly removes exercise logs before users to respect the schema's `NoAction` custom-machine relation. It never resets or deletes the development database.

```powershell
$env:TEST_DATABASE_URL='postgresql://postgres:YOUR_PASSWORD@localhost:5432/metaform_gym_test?schema=public'
npm.cmd run test:dashboard --workspace @metaform/api
```

## Frontend consumption

The future dashboard client should call the endpoint once after authentication, parse the shared public contract, and render explicit loading, error, empty, and success states. It should not recalculate streaks, percentages, PRs, or representative loads. Trend color and meaning should use the user's goal rather than treating weight direction as universally good or bad.

## Known limitations and future analytics

- UTC is the only timezone until user timezone preferences exist.
- Multiple body measurements on one date remain separate points with the same date label.
- Independent parallel reads can differ slightly if a workout is completed during response generation.
- Maximum session load is intentionally simpler than volume, estimated 1RM, or rep-aware strength measures.
- PR is derived from qualifying weight history rather than trusting the stored `isPersonalRecord` flag.

Future ML work can query normalized measurement, session, log, and set history directly for regression or plateau detection. The bounded home-summary contract should not be expanded into a raw training dataset prematurely.
