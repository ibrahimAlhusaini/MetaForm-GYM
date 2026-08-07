# Profile Frontend

## Route and scope

`/app/profile` is a protected bilingual Profile page inside the existing
authenticated application shell. It supports the seven fields exposed by the
Profile backend and deliberately excludes avatars, public/admin profiles,
notifications, body-measurement logging, and AI Coach behavior.

## Architecture

The feature lives under `apps/web/src/features/profile`:

- `services` owns the four authenticated API calls.
- focused hooks own profile, completeness, summary, and mutation state.
- `validation` creates one translation-aware Zod schema.
- `utils/profile-payload.ts` is the only form-to-PATCH transformer.
- `utils/profile-formatters.ts` centralizes locale-aware units and percentages.
- presentation components independently render form, completeness, summary,
  loading, and safe error states.
- `ProfilePage` coordinates confirmed data and post-save refreshes.

No Profile data is stored globally or persisted in browser storage.

## API integration

The feature uses the existing authenticated Axios client:

- `GET /profile`
- `PATCH /profile`
- `GET /profile/completeness`
- `GET /profile/summary`

Automatic access-token refresh remains owned by the client. UI errors are
localized fixed messages; raw Axios or backend details are never displayed.

## Missing legacy profiles

When `initialized` is false, the normal edit form remains available with clear
onboarding guidance. Full name is required, and the first PATCH always includes
it. There is no separate initialization route and no invented default data.

## Dirty fields and null semantics

React Hook Form tracks changed controls. The payload builder applies these rules:

- untouched fields are omitted;
- a changed nonblank number becomes a number;
- intentionally blank nullable dates, numbers, and selects become `null`;
- full name is trimmed and cannot be cleared;
- the initial legacy-profile PATCH includes full name.

After success, the PATCH response becomes the last confirmed form state.
Discarding changes resets locally to that state without a request. Completeness
and summary refetch independently; the page never hard reloads.

## Validation

One schema factory receives the active translator. It mirrors backend name,
height, weight, enum, date-only, and birth-date age-window constraints. The date
control preserves `YYYY-MM-DD`; it is not converted to a timestamp. Age shown in
the summary always comes from the server and is never calculated for display.

## Completeness and summary

Completeness percentage, status, and missing-field ordering are rendered exactly
from the server response. The frontend does not contain a required-field scoring
algorithm. Missing-field keys are translated in the Profile namespace.

The summary renders the server-provided display name, age, measurements, enum
context, and compact completeness. Null values use the shared localized “not
specified” state rather than fabricated values.

## Current weight, Nutrition, and Dashboard

Profile weight is a snapshot. Saving it makes only a Profile PATCH and never
creates a BodyMeasurement. The page explicitly explains this distinction.
Nutrition may use profile birth date, gender, height, weight, activity, and goal
for prefill. Dashboard continues to prefer the latest logged BodyMeasurement and
uses Profile weight only as its fallback.

## Internationalization and RTL

English and Arabic use the typed `profile` namespace. Enum display labels remain
centralized in `i18n/enum-labels.ts`, while shared enum value arrays are defined
once in `i18n/enum-values.ts`. Arabic inherits the application-level RTL mode.
Numeric and native date inputs use LTR direction so values remain predictable;
all surrounding labels, panels, messages, and actions follow RTL layout.

## Accessibility

- semantic form and section headings;
- explicit labels and associated helper/error text;
- React Hook Form error focus;
- keyboard-operable native inputs, selects, and buttons;
- visible focus styling;
- native progress semantics with a translated accessible percentage;
- `aria-live` save success/error feedback;
- complete/incomplete meaning expressed in text, not color alone;
- independently focusable retry controls.

## Privacy

The page does not log, cache, or persist profile values, weight, or birth date.
Only the existing language preference may use localStorage. Authentication tokens
remain memory-only under the existing auth store/client architecture.

## Responsive behavior

Desktop uses a wide form column with completeness and summary in a supporting
column. Smaller layouts stack all sections, use full-width controls and actions,
and avoid horizontal overflow. The design uses the existing dark charcoal,
restrained lime, subtle-border system.

## Known limitations and extension guidance

- The backend exposes one full name rather than structured/localized names.
- Avatar management is intentionally unavailable.
- Clearing a completeness field is allowed and visibly lowers server completeness.
- Native date-control appearance depends on the browser.
- Future AI Coach work may consume the compact backend summary, but should not
  couple to Profile form state or expand the stored client-side data surface.
