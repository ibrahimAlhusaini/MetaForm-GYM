# Exercise Library frontend

## Route map

All routes are nested below the existing authenticated application shell and therefore use `ProtectedRoute`.

| Route                        | Purpose                                                |
| ---------------------------- | ------------------------------------------------------ |
| `/app/exercises`             | Published, filtered, bounded exercise discovery        |
| `/app/exercises/:exerciseId` | Published exercise detail and media guidance           |
| `/app/weights/sessions/new`  | Workout builder with library or custom-machine sources |

The frontend links by exercise UUID. A slug route was intentionally omitted because it would duplicate detail ownership without improving the authenticated workflow.

## Feature architecture

`apps/web/src/features/exercise-library` owns its pages, presentational components, typed hooks, API service, query utilities, and label configuration. The authenticated Axios client remains the only HTTP transport. Hooks expose safe loading, error, success, and retry states; components never inspect Axios errors.

The service has four focused operations:

- `fetchExercises` calls `GET /api/v1/exercises` with bounded pagination and composable filters.
- `fetchExerciseFilterOptions` calls `GET /api/v1/exercises/filter-options`.
- `fetchExercise` calls `GET /api/v1/exercises/:exerciseId`.
- `fetchExerciseOptions` calls `GET /api/v1/exercises/options` for lightweight workout selection.

The same options service and hook are reused by Weight Tracker. Full exercise details are never requested by a workout selector.

## Filter flow and subgroup behavior

Search input is preserved locally and submitted explicitly. Select filters apply immediately. Search, filter, and sort changes reset pagination to page 1; page controls keep the current query intact. The list uses a fixed page size of 12.

The backend filter-options response is the source of truth for every rendered option. A subgroup selector is disabled until a primary muscle is selected. Changing the primary muscle always clears the selected subgroup before the next request, then renders only `muscleSubgroupsByPrimaryMuscle[primaryMuscle]`. No subgroup compatibility map exists in frontend code.

“Clear filters” clears applied search, visible search text, classifications, and sorting, then returns to page 1.

## List and detail states

Filter-options and exercise-list loading/errors are independent, so one failure does not erase useful content from the other request. The list distinguishes no published content from no filtered matches. Detail provides loading, safe not-found/API error, retry, missing media, and missing optional-content states. Raw backend and Axios errors are not displayed.

Cards use a lazy image or an accessible fallback and never autoplay media. Detail uses only the returned `videoUrl` in a native HTML5 player with controls, metadata preload, no autoplay, and the returned thumbnail as its poster. A null video URL produces a written unavailable state. The client does not download, proxy, inspect, or transform media.

Instructions are ordered lists and common mistakes are unordered lists. Both render plain React text nodes; unsafe HTML rendering is not used.

## Weight Tracker integration

Each workout entry contains an explicit `sourceType` plus draft `exerciseId` and `customMachineId` fields. The source selector presents “Exercise Library” and “My Machines” as accessible radio choices. Library search is debounced by 300 ms and capped at 20 lightweight options. Results show name, primary muscle, subgroup, equipment, and a thumbnail fallback.

Switching source type clears only the incompatible ID and preserves entry notes and all set drafts. Validation requires a valid UUID for the active source and also verifies that exactly one ID is selected. Payload transformation independently derives the two API fields from `sourceType`:

```text
Exercise Library -> exerciseId = selected UUID, customMachineId = null
My Machines      -> exerciseId = null, customMachineId = selected UUID
```

This explicit invariant prevents stale hidden IDs from reaching bulk-session submission. Existing custom-machine workflows remain available, including when the user has no published option selected.

## Labels, accessibility, and responsive behavior

Exercise equipment, difficulty, movement, subgroup, sorting, and pagination labels are centralized in the Exercise Library configuration. The pre-existing Weight Tracker muscle-label map remains the single primary-muscle label source and is reused by both features.

Pages use semantic headings, labeled native selects, a search landmark, focus-visible controls, descriptive links and image text alternatives, native video controls, semantic content lists, and live loading/refetch regions. Selection is not communicated by color alone: options expose `aria-selected` and source buttons expose radio state.

The library uses one card column on mobile, two on tablet, and three on wide desktop. Filters stack on mobile and form a structured grid at larger breakpoints. Detail media is full width on small screens and becomes a media/content column layout on wide screens. Scroll-bounded selector results prevent page overflow and keep controls touch friendly.

## Known limitations

- Backend search is case-insensitive substring matching without ranking, typo tolerance, or highlighted matches.
- Legacy published exercises may return `muscleSubgroup: null`; the UI displays “Not classified.”
- The lightweight options endpoint has no pagination metadata. The selector requests at most 20 and users refine with search.
- Remote image or video hosts can fail independently after metadata loads. Images fall back; native video playback behavior remains browser-dependent.
- Filters are intentionally not persisted to URLs or local storage in this phase.
- There is no admin exercise UI, upload flow, transcoding, rating, favorite, or recommendation system.

## Future S3 and CloudFront integration

Future media infrastructure should upload and process assets outside this feature, then continue storing final HTTPS delivery URLs in the unchanged `thumbnailUrl` and `videoUrl` fields. The frontend should remain URL-only. Signed URL refresh, object lifecycle, transcoding state, and authorization belong to a dedicated media service and should not be embedded in Exercise Library list or detail components.

## Extension guidelines

- Add backend enum values to the shared contract and the one frontend label configuration.
- Continue sourcing subgroup compatibility only from `/filter-options`.
- Keep list and selector request shapes separate; never expand selector items with detail content.
- Preserve bounded requests and the stable backend sort tie-breaker.
- Add a focused hook or component instead of expanding either page into a multipurpose controller.
- Preserve safe text rendering and explicit empty states when adding instructional fields.
- Keep the exactly-one-source rule in draft validation and payload transformation whenever workout entry editing is extended.
