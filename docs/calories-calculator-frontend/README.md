# Calories Calculator frontend

## Route

`/app/calories` is an authenticated application-shell route. Unauthenticated access continues through the existing `ProtectedRoute` redirect to `/login`.

## Feature architecture

The feature lives in `apps/web/src/features/nutrition` and is split by responsibility:

- `services/` owns authenticated HTTP calls.
- `hooks/` owns independent profile, calculation, latest, and history request state.
- `validation/` owns the React Hook Form-compatible Zod schema.
- `utils/` owns payload construction, date-query conversion, and locale-aware display formatting.
- `constants/` is the single frontend source for enum labels and disclaimer text.
- `components/` contains focused form, result, latest, history, state, and disclaimer views.
- `pages/` composes those pieces and coordinates successful refreshes.

Shared contracts remain in `@metaform/shared-types`; UI concerns are not added to that package.

## API integration

The service uses the existing authenticated Axios client and these relative paths under `/api/v1`:

- `GET /nutrition/profile-inputs`
- `POST /nutrition/calculate`
- `GET /nutrition/latest`
- `GET /nutrition/history`

The Axios client retains automatic access-token refresh behavior. Errors are converted to stable user-facing messages by hooks, and raw Axios, database, or server details are never rendered.

## Profile prefill and overrides

Profile values initialize the form without changing the user profile. Each field displays `From profile`, `Manually entered`, or `Required`.

An untouched prefilled field is omitted from the calculation request. The backend therefore resolves it from the profile and records `PROFILE` as its source. A dirty field is sent as a one-time request override and is recorded as `REQUEST`. This is deliberate: sending every prefilled value would lose accurate source attribution.

Missing profile values remain blank. No defaults are invented. `PREFER_NOT_TO_SAY` remains visible and unchanged in the stored profile; the form respectfully explains that this formula needs a temporary male or female calculator value.

## Validation

React Hook Form and Zod enforce the backend input bounds before submission:

- age: whole number from 14 through 100
- height: 100 through 250 cm
- weight: 30 through 350 kg
- calculator gender: male or female
- activity and goal: supported contract enums

Empty strings are form-only values and are not sent to the API.

## Result presentation

The response is the sole source for BMI, BMR, TDEE, calorie targets, macros, water, calculation flags, methodology, version, timestamp, and disclaimer. The browser performs no nutrition formulas. Recommended calories receive visual emphasis while maintenance, bulk, and cut remain visible alternatives.

BMI is presented as a neutral screening estimate, not a diagnosis. The safety-floor and macro-fallback notices appear only when their corresponding API flags are true.

## Latest and history

Latest is an independent compact summary and supports a true empty state when the API returns `null`. It intentionally does not duplicate the full primary result.

History requests are bounded to 10 records. Page, sort order, and applied date filters are request state. Changing sorting or date filters resets the page to one. Date-only controls are converted to inclusive UTC day boundaries before querying. Legacy rows with missing input context, recommended calories, flags, or methodology use `Not available` instead of fabricated values.

After a successful calculation, latest and history refetch and focus moves to the labeled result region.

## Loading, error, and empty states

Profile, latest, and history load independently. The result has a pre-calculation empty state; latest and history have data-aware empty states. Profile/latest/history errors provide retry controls. Calculation errors preserve form input. All status messaging is safe and avoids blank screens.

## Accessibility

- Semantic form, headings, lists, definition lists, navigation, and aside regions are used.
- Every input has a visible label and unit; field errors use alert semantics.
- Loading states expose `role=status`, `aria-busy`, and descriptive labels.
- Calculation output is an `aria-live`, programmatically focusable labeled region.
- Controls have keyboard focus treatments and touch-safe dimensions.
- BMI and calculation flags use text, not color alone.

## Responsive behavior

The desktop page uses a two-column calculator/result layout with full-width latest and history sections. It collapses to stacked sections on narrower screens. Metric grids reduce their column count, history uses responsive cards rather than a dense table, and date/filter controls stack without horizontal overflow.

## Formatting and labels

Units, dates, numbers, activity labels, goal labels, BMI labels, and input-source labels are centralized. `Intl.NumberFormat` and `Intl.DateTimeFormat` use the browser locale. Backend enum values never need duplicated presentation maps elsewhere in the feature.

## Analytics ownership

The frontend only presents nutrition API output. It does not reproduce formulas or update Dashboard analytics directly. Dashboard daily calories reflect the saved calculation when Dashboard next loads or refreshes.

## Known limitations

- The profile is read-only in this feature.
- Historical records created before current context fields may be incomplete.
- Date filters are day-based UTC boundaries because the backend accepts timestamps, not a user-time-zone date contract.
- The page does not live-update an already-mounted Dashboard tab.
- No meal planning, food tracking, supplements, recommendations, or medical interpretation are included.

## Extension guidelines

Future consumers, including an AI Coach, should reuse the shared nutrition contracts and the service boundary rather than copy formulas or parse rendered UI. New enum labels belong in the centralized constants. New result fields should be added to shared contracts and rendered directly. Profile editing, if introduced, must remain a separate feature so temporary calculator overrides keep their current semantics.
