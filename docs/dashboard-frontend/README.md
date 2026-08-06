# Home dashboard frontend

## Architecture

The authenticated `/app` index route renders `DashboardPage` inside the existing application shell. The feature is owned by `apps/web/src/features/dashboard` and is divided into three layers:

- `services/dashboard.service.ts` calls `GET /dashboard/summary` through the existing authenticated Axios client.
- `hooks/useDashboardSummary.ts` owns the page-local loading, error, success, and retry state.
- `components/` contains focused, data-driven presentation components. `DashboardPage` only composes these states and sections.

The dashboard does not add global state. Authentication, access-token attachment, refresh rotation, and unauthenticated redirects remain owned by the existing auth architecture.

## API integration

`fetchDashboardSummary` returns `DashboardSummaryData` from `@metaform/shared-types`. It uses the configured Axios client, so requests include the in-memory Bearer token and retain the existing single-flight refresh behavior.

The dashboard service shares only an active request. This prevents React development Strict Mode and concurrent consumers from issuing duplicate requests while avoiding persistent cross-user caching. A retry or a later mount starts a fresh request after the prior request settles.

All analytics are backend-owned. The frontend does not calculate streaks, personal records, trends, weekly percentages, representative loads, or data availability. It only formats and presents returned values.

## UI states

- Loading renders a labelled skeleton for the heading, overview, body-weight chart, and strength cards.
- Request failure keeps the application shell visible, shows a generic safe message, and offers a focusable retry button. Authentication failures continue through the established Axios and route-guard flow.
- Successful responses render each section independently. Missing weight, nutrition, workouts, body measurements, or strength history does not hide available sections.
- Empty charts are replaced by descriptive empty states; no synthetic points or placeholder analytics are generated.

## Charts

Recharts renders a linear body-weight line and compact load-progress lines. Returned points are passed through unchanged, missing dates are not interpolated, and animation is disabled for predictable rendering. A single strength card supports both exercises and custom machines without grouping them by display name.

Trend direction is descriptive and uses neutral styling because the summary contract does not currently expose a fitness goal. Increasing and decreasing values are never presented as inherently good or bad.

Every chart has an accessible label and a textual summary so its essential information is available without interpreting the graphic. Tooltips format chart dates and weights consistently.

## Formatting and responsiveness

Focused formatter utilities use the browser locale through `Intl.DateTimeFormat` and `Intl.NumberFormat`. They centralize dates, kilograms, calories, durations, counts, and signed changes while safely handling nullable values and avoiding floating-point noise.

The overview uses a responsive grid, the main analytical sections stack at smaller widths, and strength cards move from one to two columns on wide screens. Chart containers have bounded heights and minimum-width protection to avoid horizontal overflow.

## Accessibility

The page uses semantic sections and heading levels, descriptive chart regions, meaningful image alternative text, visible shell focus treatments, and text labels in addition to color. Loading status uses `aria-busy`; request errors use an alert; decorative icons are hidden from assistive technology.

## Extending the dashboard

To add a future overview card:

1. Extend the public backend response and shared contract first.
2. Add the display mapping in `OverviewGrid` using `MetricCard` or a focused specialized card.
3. Add nullable and populated behavior tests without recreating the backend formula.

To extend strength visualization, add display-only behavior to `StrengthProgressCard` or extract a focused chart component when a second consumer exists. Do not fetch per item or merge sources with equal names.

## Local development and tests

Set `VITE_API_URL` in `apps/web/.env` (for example, `http://localhost:3000/api/v1`), then run from the repository root:

```powershell
npm run dev:api
npm run dev:web
npm run test --workspace @metaform/web
npm run build --workspace @metaform/web
```

Frontend tests mock the dashboard service and Recharts rendering. They do not use the development API or database.

## Known limitations

- The first version uses the browser locale and has no user-selectable locale or timezone.
- Trend meaning cannot be goal-aware until the backend deliberately adds a fitness-goal field to the public contract.
- Charts expose their values through summaries and tooltips, but do not yet provide a downloadable data table.
- Dashboard data is request-local and is not cached after the request settles.
