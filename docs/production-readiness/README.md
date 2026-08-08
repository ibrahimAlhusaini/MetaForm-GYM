# Production Readiness and Performance Hardening

This is the release gate before any cloud deployment. It does not authorize a
deployment or change the frozen body-weight or strength evidence protocols.

## Performance report

Before hardening, Vite eagerly bundled every authenticated page and Recharts.
Route-level lazy loading produced the measured result below without changing the
warning threshold or adding manual vendor chunks.

| Metric                     |                       Before |                         After |
| -------------------------- | ---------------------------: | ----------------------------: |
| Main entry                 | 1,154.09 kB / 326.03 kB gzip |     292.68 kB / 93.24 kB gzip |
| Preloaded initial JS graph | 1,154.09 kB / 326.03 kB gzip |    575.75 kB / 179.42 kB gzip |
| Largest emitted chunk      |                  1,154.09 kB | 350.26 kB lazy Recharts chunk |
| Major lazy page chunks     |                            0 |                            19 |
| Vite >500 kB warning       |                      Present |                       Removed |

The authenticated shell, guest auth pages, route guards, and localization
bootstrap remain eager. Dashboard, Weight Tracker, Body Weight, Exercise
Library, AI Coach, Calories, Workout Plans, Profile, and detail pages load at
their route boundaries. Chart routes alone load the shared Recharts chunk.

## Release configuration matrix

Names and purposes only; never commit real values.

| Class          | Local development                      | Test                                                            | Production                                                           |
| -------------- | -------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------- |
| Mode           | `NODE_ENV=development`                 | `NODE_ENV=test`                                                 | `NODE_ENV=production`                                                |
| Database       | `DATABASE_URL` local DB                | isolated `TEST_DATABASE_URL`; harness maps it to `DATABASE_URL` | production `DATABASE_URL`                                            |
| Browser origin | local `FRONTEND_URL`                   | test `FRONTEND_URL`                                             | exact HTTP(S) `FRONTEND_URL` origin                                  |
| Public API     | local `VITE_API_URL`                   | test runner config                                              | public HTTPS `VITE_API_URL`                                          |
| Auth           | unique local JWT secrets               | test-only JWT secrets                                           | independently generated `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` |
| AI             | optional paired provider variables     | mocked provider                                                 | paired `OPENAI_API_KEY` and `AI_COACH_MODEL` when enabled            |
| Predictions    | loopback URL/default and timeout       | mocked or local smoke                                           | explicit internal `BODY_WEIGHT_PREDICTION_SERVICE_URL` and timeout   |
| Analytics      | optional read-only analytics variables | synthetic/test settings                                         | separate read-only role only for intentional evidence runs           |

Only `VITE_` values are public. The frontend build must never contain OpenAI
keys, database URLs, JWT secrets, or the internal Python URL.

## Application

- [ ] Shared types, API, and frontend production builds pass.
- [ ] Python imports from the installed environment.
- [ ] Lazy routes show a localized live-status fallback, not a blank screen.
- [ ] The render boundary shows localized generic UI without technical details.
- [ ] Start the prediction service without notebooks:

  ```powershell
  .\data-science\.venv\Scripts\python.exe -m uvicorn metaform_ds.serving.app:app --app-dir data-science/src --host 127.0.0.1 --port 8001
  ```

## Security

- [ ] Generate and store production secrets in the deployment secret manager;
      rotate values that have left their intended environment.
- [ ] Serve frontend and API over HTTPS only and preserve Helmet headers.
- [ ] Configure one exact `FRONTEND_URL`; credentialed CORS never uses `*`.
- [ ] Confirm refresh cookies are HttpOnly, Secure in production,
      `SameSite=Lax`, and scoped to `/api/v1/auth`.
- [ ] Deploy frontend and API as same-site origins. A cross-site topology needs
      an explicit CSRF/cookie review before `SameSite=None; Secure`.
- [ ] Put the API behind exactly one controlled proxy before relying on the
      current production `trust proxy = 1`; do not expose it directly as well.
- [ ] Preserve login, registration, and AI generation rate limits.
- [ ] Preserve the 32 kB Express/FastAPI limits and feature schema bounds.
- [ ] Keep access tokens memory-only and refresh tokens cookie-only.
- [ ] Run secret, public-environment, and ignored-artifact scans.

## Database

- [ ] Use only the intended production `DATABASE_URL`, never a test database.
- [ ] Verify a restorable PostgreSQL backup before migrations.
- [ ] Run Prisma format, validate, generate, then apply reviewed migrations
      before starting the new API revision.
- [ ] Check `/api/v1/health/database` separately from core health.
- [ ] Define rollback ownership. Use corrective migrations rather than deleting
      production history.

No speculative indexes were added. Reviewed lists are bounded or paginated,
prediction queries are capped, and current indexes support the major user/date
access paths.

## AI and optional-service degradation

- [ ] Configure `OPENAI_API_KEY` and `AI_COACH_MODEL` together.
- [ ] Confirm provider billing, quota, model access, explicit timeout, zero SDK
      retries, and one structured-output smoke without logging prompt/context.
- [ ] Verify OpenAI outage preserves non-AI routes and returns safe AI UX.
- [ ] Verify Python outage preserves core health and non-prediction features.
- [ ] Keep `/api/v1/health` independent from database, OpenAI, and Python; use
      `/api/v1/health/database` as the separate database diagnostic.

## Python service

- [ ] Keep FastAPI internal-only. Local startup binds `127.0.0.1`; future
      network placement must likewise avoid public exposure.
- [ ] Verify `/health`, body-weight prediction, and strength prediction.
- [ ] Keep API-to-Python timeouts and sanitized unavailable responses.
- [ ] Do not add CORS, PostgreSQL credentials, user IDs, auth tokens, or raw
      fitness payload logging.
- [ ] Keep the 32 kB body limit and strict Pydantic bounds.
- [ ] Use the eventual hosting platform's supervised restart policy; none is
      selected in this repository stage.

## Frontend

- [ ] Set production `VITE_API_URL` before building and verify HTTPS.
- [ ] Confirm no secrets or internal-service values exist in `dist`.
- [ ] Smoke all lazy routes through direct and client navigation.
- [ ] Check English/Arabic, `lang`, RTL, keyboard navigation, dialogs, forms,
      errors, and chart textual summaries.
- [ ] Check desktop/tablet/mobile sidebar, drawer, lists, plan editor, AI Coach,
      body weight, source history, and charts for horizontal overflow.

## Operations

- [ ] Monitor core API, database, and internal FastAPI health independently.
- [ ] Capture structured API stdout/stderr with event, status, failure
      class/code, and server-generated request ID.
- [ ] Never log tokens, passwords, keys, prompts/context, measurement arrays,
      strength histories, or full user payloads.
- [ ] Configure restart policy and allow the API's 10-second shutdown deadline.
- [ ] Record release revision, migration order, health gates, rollback owner,
      and previous deployable revision.
- [ ] Set an approved log-retention/privacy policy; this stage chooses no vendor.

## Data Science

- [ ] Keep both prediction features visibly labeled Research Preview.
- [ ] Make no clinical, production-validation, guaranteed-progress, or model
      superiority claims.
- [ ] Preserve model-selection and evidence fingerprints; keep Linear/Ridge
      research-only until a separate evidence-backed promotion review.
- [ ] Run real evidence only through the separate read-only analytics role and
      explicit operational approval.

## Verification gate

- [ ] Strict TypeScript, ESLint, and changed-file Prettier checks pass.
- [ ] Full frontend and isolated-database API Vitest suites pass.
- [ ] Ruff lint/format, strict mypy, full pytest, and Python import pass.
- [ ] Prisma format, validate, and generate pass.
- [ ] API core/database health and FastAPI health/body-weight/strength smokes
      pass, including unavailable states.
- [ ] English, Arabic, RTL, keyboard, and responsive browser checks pass.
- [ ] `git diff --check`, secret/env-exposure scan, and artifact checks pass.

## Known non-blocking technical debt

- The 350.26 kB Recharts chunk is lazy and below the warning threshold;
  replacing the library is not justified by current evidence.
- Both locale resources remain initial for immediate language switching.
  Locale-on-demand loading needs separate measurement before consideration.
- pg/Prisma adapter tests can emit a concurrent-query deprecation warning, and
  FastAPI TestClient emits a Starlette/httpx transition warning. These originate
  upstream; dependency health is clean, so no workaround is applied.
- Staging, load testing, backup restore drills, TLS/edge validation, process
  supervision, and cloud architecture remain future release work.

## Stop boundary and next stage

Stop before cloud deployment. After checklist ownership and staging values are
available, the next stage is a separate AWS architecture and staging plan for
network boundaries, managed PostgreSQL, secrets, HTTPS/DNS, supervision,
migrations, observability, backup/restore, smoke gates, and rollback. This stage
creates no AWS resources.
