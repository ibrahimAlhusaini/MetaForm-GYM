# AI Coach Frontend V1

## Routes

- `/app/ai-coach` — capability discovery, guided generation, current result, and bounded history.
- `/app/ai-coach/sessions/:sessionId` — protected historical result detail.

Both routes use the existing authenticated application shell. URLs are language-independent.

## Guided, non-chat UX

AI Coach V1 intentionally has no textarea, prompt field, conversation transcript, simulated streaming, model selector, or automatic action. The backend capability response determines which supported cards appear. A single presentation registry maps stable capability codes to icons and localized labels; an unknown future code is skipped with a safe notice.

The supported flows are progress analysis, plateau detection, workout-plan review, next-workout guidance, nutrition review, and weekly summary. Only inputs required by the selected capability are displayed.

## Source and plan selection

Plateau detection and next-workout guidance reuse the existing debounced `useExerciseOptions` hook for published exercises and `useMachines` for the authenticated user's custom machines. Results are bounded to ten items. Switching source type clears the incompatible selection.

Workout-plan review reuses `useWorkoutPlans` with `ownership: all`, allowing the backend to return owned, public, and system-visible plans while preserving privacy. The request is bounded to ten plans and displays difficulty, ownership/template context, and training/rest-day counts.

No source or plan data is copied into the generation request. Only the selected stable ID and source type are sent.

## Generation and validation

A discriminated Zod schema validates the final request. The payload builder emits one of the shared `AiCoachSessionCreateRequest` variants. It cannot add a prompt, user ID, profile, history, provider configuration, or context. The existing authenticated Axios client owns access-token refresh.

The active application language is read at submission time: English sends `en`, Arabic sends `ar`. Changing language affects the next request. Historical generated text is displayed exactly as returned and is never translated or rewritten by the frontend.

Generation is a normal non-streaming pending state. Duplicate clicks are blocked by both a synchronous in-flight guard and a disabled action. A safe 503 produces localized provider-unavailable copy without exposing configuration names or provider details. Retrying always creates a new guided session.

## Structured results

`AiCoachResult` is shared by newly generated and historical sessions. It renders:

1. Headline and summary
2. Findings and restrained severity labels
3. Recommendations sorted by backend priority
4. Locale-formatted structured evidence
5. Cautions
6. Generated date and coach version

Unknown evidence keys are rendered verbatim rather than assigned an invented meaning. AI text is never modified. Missing legacy results receive a professional unavailable state.

Insufficient-data findings remain successful results. Stable capability-specific helper copy suggests the next logging action without adding analysis. For example, Nutrition Review points to the Calories Calculator when no saved nutrition calculation exists.

## History and detail

History defaults to newest first, uses a limit of ten, supports capability filtering, and uses backend pagination. Completed, in-progress, abandoned, and missing-headline sessions render safely. Detail is loaded through the session endpoint and the same result renderer.

## Internationalization and RTL

All frontend-owned strings live in the `aiCoach` English and Arabic namespaces. Capability names, statuses, inputs, loading/error/empty states, accessibility names, and guidance copy are translated. Exercise, machine, plan, and generated AI text remain unchanged.

Layouts use logical start/end utilities. Arabic keeps analytical chronology and recommendation priority order unchanged. Numeric evidence uses `ar-SA` or `en-US` browser-locale formatting without reversing semantic units.

## Accessibility and responsive design

- Semantic headings, sections, fieldsets, radios, labels, lists, and pagination.
- Capability buttons expose pressed state.
- Loading, validation, generation, and error feedback use status/alert semantics.
- The completed result region receives keyboard focus.
- Source choices and retry controls are keyboard accessible.
- Severity and status are stated in text, not color alone.
- Desktop uses a capability grid and selection/result split; tablet and mobile collapse naturally to stacked, full-width controls without horizontal overflow.

## Privacy

The UI never displays or persists raw context, prompts, model/provider identifiers, API keys, user IDs, or authentication tokens. AI selections, results, and session IDs are kept in component memory only. Language remains the only allowed localStorage preference. The page never modifies plans, workouts, nutrition calculations, measurements, or profile data.

## Provider unavailable behavior

When the backend returns 503, the UI displays a localized configuration-unavailable message and keeps the guided selection visible. Raw Axios/backend/provider errors are never shown.

## Testing

Frontend tests mock all services and never call the backend or OpenAI. Coverage includes discovery, retry, all capability cards, no-chat behavior, capability validation, exercise/machine/plan reuse, English/Arabic payloads, duplicate prevention, 503 behavior, structured results, recommendation ordering, unknown evidence fallback, insufficient-data success, bounded history/filtering/pagination, detail errors, RTL, application-shell routing, and localStorage privacy.

## Known limitations and future extension

- No open chat, streaming, conversations, voice, uploads, automatic changes, notifications, provider settings, or model selection.
- History V1 exposes capability filtering and pagination; date and status filters can be added later using the existing backend query without changing service ownership.
- Source and plan selectors load a bounded first page. Future UX may add explicit incremental paging while continuing to reuse the existing feature services.
- The existing application bundle is not route-split; route-level lazy loading is a separate cross-application performance improvement.

A future **Apply Recommendation preview** must remain a distinct confirmation workflow. It should translate a supported recommendation into a proposed domain mutation, display a complete diff, validate ownership and stale data, require explicit confirmation, and call the owning Workout Plans, Weight Tracker, Nutrition, or Profile API. AI Coach itself must not mutate domain records.
