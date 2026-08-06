# Weight Tracker frontend

## Routes

All routes are protected by the existing authenticated `/app` layout.

| Route                                        | Purpose                                                 |
| -------------------------------------------- | ------------------------------------------------------- |
| `/app/weights`                               | Workflow overview, recent workouts, and machine summary |
| `/app/weights/machines`                      | Searchable, filterable, sortable machine list           |
| `/app/weights/machines/new`                  | Create a custom machine                                 |
| `/app/weights/machines/:machineId`           | Edit or delete an owned machine                         |
| `/app/weights/sessions`                      | Filtered and paginated workout list                     |
| `/app/weights/sessions/new`                  | Transactional workout builder                           |
| `/app/weights/sessions/:sessionId`           | Workout aggregate detail and editing                    |
| `/app/weights/history/:sourceType/:sourceId` | Completed strength history for one exact source         |

## Feature architecture

`apps/web/src/features/weight-tracker` owns the feature. Pages orchestrate route state and mutations, focused hooks load resources, the service is the only Axios boundary, Zod schemas own validation, pure payload transformers normalize blank values, and shared formatters keep presentation consistent. Components contain no authentication logic and never receive a user ID.

The feature uses the existing authenticated Axios client. It therefore inherits refresh-token recovery, memory-only access tokens, safe logout behavior, and API base URL configuration. API failures are translated to user-safe messages; Axios, Prisma, stack traces, and backend private details are not rendered.

## API integration

The frontend consumes the existing `/api/v1/weight-tracker` contract without changing backend behavior:

- machines: list, detail, create, update, and delete;
- sessions: list, detail, bulk create, update, complete, and delete;
- logs and sets: create, update, delete, and transactional reorder;
- history: source-specific statistics, bounded chart points, and paginated sessions.

Pagination is one-based, defaults to 20 items, and never requests more than the backend maximum of 100. Sorting uses only documented fields. Server responses remain the source of truth after destructive and reorder operations; the smallest detail/list resource is refreshed after confirmation.

## Machine workflow

The machine list supports debounced-by-render search parameters, target-muscle filtering, documented sort fields, direction, and pagination. One React Hook Form component serves both create and edit. It accepts only an optional URL string for images and provides a non-broken visual fallback. No file input, local persistence, multipart request, or upload client exists.

Deletion requires an accessible confirmation. A `409` is translated into a specific explanation that machines referenced by workout history cannot be removed. Other failures use the safe generic error path. Cross-user and missing resources intentionally look the same.

## Workout builder workflow

The builder uses a feature-local draft because nested entry/set operations are clearer as immutable local updates than as global state. It supports start time, notes, immediate completion, multiple machine entries, multiple sets, and keyboard-operable move buttons. Submission runs the shared Zod schema, transforms blank numeric/text inputs to `null`, generates unique zero-based entry order and positive set numbers, and calls `POST /sessions/with-entries` once.

The draft requires at least one entry. This is intentionally stricter than the backend's blank-session capability because this route is the “save an entire workout” workflow. Failed requests preserve all entered values. The submit button is disabled while saving.

The current backend has no suitable global exercise-list endpoint. The selector therefore exposes owned custom machines only; it does not invent endpoints or hardcode exercises. Global exercise selection can be added when a read-only Exercise Library API is available.

## Session detail workflow

The detail route renders backend-ordered logs and sets, metadata, warmup state, all recorded metric types, and persisted PR indicators. Incomplete sessions allow metadata editing, adding machine logs, editing notes, set creation/editing, and explicit reorder actions. Set and log deletions, session completion, and aggregate deletion require confirmation.

Completion omits `completedAt`, allowing the backend to use its documented current-time behavior and recalculate PR flags. The page then reloads the aggregate. Already completed sessions do not render another completion action, preventing duplicate requests. Completed sessions explain that their data feeds dashboard strength analytics.

## History and chart behavior

The history page uses the API's personal record, representative weights, improvement, totals, chart points, and paginated sessions verbatim. It does not recalculate analytics in the browser. Recharts renders the bounded API chart; a textual summary is always present for assistive technology. Missing previous values display “Not available,” not zero. Machine and exercise route identities remain distinct even when names match.

## Validation and precision

Shared Zod fragments enforce backend-aligned machine limits, UUID source IDs, ISO-compatible chronology, maximum 50 logs, maximum 100 sets per log, positive set numbers, non-negative metrics, at least one non-null performance metric, and unique ordering/set positions. Zero is meaningful and is never converted to null. `isPersonalRecord` is absent from every client input type.

Weights, volume, duration, dates, muscles, source types, status, and pagination labels use centralized locale-aware formatters. API numeric values are displayed without additional progression calculations.

## Loading, errors, and empty states

Every resource page has a labelled loading skeleton, safe retry state, and purposeful empty state. The overview handles its two resources independently. Examples include no machines, no matching filters, no sessions, no exercises in a workout, and no completed strength history. Successful mutations navigate or refresh the narrowest resource and status messages use semantic live regions where appropriate.

## Accessibility

Forms use explicit labels and described validation messages. Controls are semantic buttons/links, move actions have descriptive names, focus styles remain visible, and destructive actions use native dialogs with Escape cancellation and focus restoration behavior. Status and errors use live or alert semantics. Machine fallbacks have useful image roles, icons are decorative, and color is paired with text labels. Charts include a readable summary independent of the graphic.

## Responsive design

The feature is desktop-first but collapses to single-column cards on small screens. Forms use minimum touch heights, set rows wrap instead of overflowing, wide statistics reduce columns at tablet/mobile widths, and the responsive chart container owns its available width. Lists use cards rather than fixed wide tables, avoiding horizontal clipping.

## Dashboard behavior

Saving and completing workouts writes through the same backend models consumed by dashboard analytics. Completed non-warmup weighted sets therefore appear automatically after the dashboard refetches. Deleting a session removes its aggregate and its analytics contribution; the frontend does not maintain a competing client-side cache or analytics model.

## Image upload and future S3 integration

Image upload is postponed by design. A future upload flow can obtain an S3 object URL from a dedicated backend contract and pass that URL through the existing `imageUrl` field. `MachineForm` and `MachineImage` can remain unchanged; upload progress and object lifecycle should live in a separate focused integration.

## Known limitations

- Session creation and add-entry selection are custom-machine-only until an Exercise Library read API exists.
- Workouts are not persisted offline or to local storage.
- There is no drag-and-drop; accessible move-up/down controls provide deterministic reordering.
- Image URLs are previewed but their remote availability cannot be guaranteed.
- The session builder creates an aggregate; incremental editing happens on the detail route after creation.

## Extension guidelines

Add new endpoints only through `weight-tracker.service.ts`, expose loading through a focused hook, reuse the shared safe error translator and pagination component, and extend Zod schemas before adding form controls. Keep backend-derived analytics server-owned. New source types must receive distinct route identity and explicit mapping rather than name-based merging. Exercise Library integration should provide a paginated selector adapter without coupling library administration to this feature.
