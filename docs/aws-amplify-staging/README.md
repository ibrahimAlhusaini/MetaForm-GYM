# AWS Amplify staging frontend

This runbook prepares the React/Vite application for a future, owner-operated
AWS Amplify Hosting staging deployment. It does not authorize creating an
Amplify app or changing the deployed ECS service.

## Readiness decision

`READY_WITH_REQUIRED_BACKEND_HTTPS_FIX`

The frontend can be built as an Amplify-hosted static SPA, but it must not be
published with the current HTTP-only ALB as `VITE_API_URL`. An Amplify hostname
is HTTPS. Browsers block Axios/fetch requests from an HTTPS page to an HTTP API
as active mixed content. Amplify reverse proxies also support HTTPS targets
only, so a rewrite is not a safe bridge to the current HTTP listener.

Before the first useful staging frontend deployment, give the API a public
HTTPS origin by adding an ALB HTTPS listener with a valid certificate and an
appropriate DNS name. Keep HTTP only as a redirect to HTTPS. This later backend
change is outside this task.

## Repository and branch assumptions

- Repository: the Git repository whose root is the MetaForm GYM monorepo.
- Current remote: `https://github.com/ibrahimAlhusaini/MetaForm-GYM.git`.
- Intended initial branch: `main`. The owner must verify that `main` is the
  approved staging source branch and contains this configuration before using
  the console.
- Package manager: npm, using the committed root `package-lock.json`.
- Node build runtime: Node.js 22 on the Amplify Amazon Linux 2023 image.
- Amplify monorepo app root: `apps/web`.
- Build working directory: repository root (`buildPath: /`).

AWS requires the monorepo `appRoot` and `AMPLIFY_MONOREPO_APP_ROOT` values to
match. Selecting **My app is a monorepo** and entering `apps/web` in the console
sets the variable automatically.

## Build configuration

The repository-root `amplify.yml` is authoritative:

```yaml
version: 1
applications:
  - appRoot: apps/web
    frontend:
      buildPath: /
      phases:
        preBuild:
          commands:
            - nvm use 22
            - npm ci
            - node -e "# validates VITE_API_URL as HTTPS /api/v1"
        build:
          commands:
            - npm run build --workspace @metaform/shared-types
            - npm run build --workspace @metaform/web
      artifacts:
        baseDirectory: apps/web/dist
        files:
          - '**/*'
```

Running from the repository root is necessary because npm workspaces and the
single lockfile live there. `npm ci` installs the exact locked dependency graph
and links `@metaform/shared-types`; the shared workspace is built before the web
workspace. Dependencies must not be copied into `apps/web` or installed with a
second lockfile.

Vite has no custom `build.outDir`, so its output is the default
`apps/web/dist`. Because `buildPath` is `/`, the Amplify artifact base directory
is `apps/web/dist`.

The build-time check deliberately rejects a missing URL, HTTP, credentials,
query strings, fragments, and paths other than `/api/v1`. It does not print the
value.

## Environment variables

Configure this branch-scoped public build variable only after the API HTTPS
hostname exists:

| Variable | Required value |
| --- | --- |
| `VITE_API_URL` | `https://<STAGING_API_HOST>/api/v1` |

Vite compiles `VITE_*` values into publicly downloadable JavaScript. Never put
credentials, tokens, private endpoints, or secrets in this or any other
`VITE_*` variable. The current `http://<ALB_DNS>/api/v1` is not acceptable.

`AMPLIFY_MONOREPO_APP_ROOT=apps/web` is set by Amplify when the monorepo option
is selected. If an app is created through another workflow, verify it manually.

## SPA routing

The application uses `BrowserRouter`, so direct requests for client-side routes
must return `index.html` with status 200. After app creation, add this AWS
recommended rule under **Hosting > Rewrites and redirects**:

```json
[
  {
    "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>",
    "target": "/index.html",
    "status": "200",
    "condition": null
  }
]
```

This enables refresh/direct navigation for `/app/dashboard`, `/app/weights`,
`/app/ai-coach`, and other extensionless React routes while leaving normal
static asset extensions untouched. Do not use `/<*>` as an unconditional
fallback. Do not add an Amplify `/api` proxy rule: browser API requests use the
absolute cross-origin `VITE_API_URL` and go directly to the HTTPS ALB. CORS on
the API remains one exact frontend origin, never `*`.

## Owner console procedure — DO NOT EXECUTE YET

Prerequisites before starting: the backend has a verified HTTPS API hostname,
the API URL is known, this commit is on the approved staging branch, and the
owner is ready to create billable AWS resources.

1. Sign in with the approved AWS account/profile context and select
   `eu-central-1`.
2. Open **AWS Amplify > Create new app > Host web app**.
3. Select GitHub, authorize only the required repository access, select
   `MetaForm-GYM`, and select the approved staging branch (`main` under the
   current assumption).
4. Select **My app is a monorepo** and set the app path to `apps/web`. Verify
   Amplify shows `AMPLIFY_MONOREPO_APP_ROOT=apps/web`.
5. Use the repository `amplify.yml`; confirm `buildPath: /`, `npm ci`, the two
   workspace build commands, and artifact directory `apps/web/dist`.
6. Select the managed Amazon Linux 2023 build image and the economical Standard
   build instance. Do not enable an Amplify backend, SSR compute, WAF, custom
   domain, or pull-request previews for this static staging SPA.
7. Add the branch-scoped environment variable
   `VITE_API_URL=https://<STAGING_API_HOST>/api/v1`. Add no secrets.
8. Review the app name, repository, branch, service role requirements, build
   settings, environment variable, and estimated charges.
9. Choose **Save and deploy** only after separate authorization to perform the
   deployment.
10. When the branch succeeds, expect a managed hostname resembling
    `https://<branch>.<app-id>.amplifyapp.com`.
11. Add the asset-aware SPA rewrite above and verify direct navigation to the
    three representative routes.
12. Treat the exact Amplify origin (scheme plus hostname, without a path or
    trailing slash) as the future CDK `StagingFrontendUrl`, for example
    `https://main.<app-id>.amplifyapp.com`. Update the API stack with that exact
    origin before changing `StagingDesiredCount` to 1. This requires a later,
    separately approved CDK deployment.

The first end-to-end browser test is valid only after both sides use HTTPS, the
API has the exact Amplify origin in `FRONTEND_URL`, ECS desired count is 1, and
the ALB target is healthy.

## Verification after a future deployment

- Confirm the served page and browser location are HTTPS.
- Refresh `/app/dashboard`, `/app/weights`, and `/app/ai-coach`; each must serve
  the SPA rather than an Amplify 404.
- Confirm hashed files under `/assets/` return their actual content and are not
  rewritten to `index.html`.
- Confirm API calls target `https://<STAGING_API_HOST>/api/v1`, never the
  Amplify hostname and never HTTP.
- Confirm credentialed CORS accepts the exact Amplify origin and rejects other
  origins.
- Confirm authentication refresh cookies are `Secure` in the staging runtime.

## Rollback and removal

If the frontend build is bad, use Amplify branch deployment history to redeploy
the last known-good commit or disconnect automatic builds while correcting the
branch. If the staging frontend is no longer needed, disable/delete its branch
and then delete only the dedicated Amplify app after checking custom domains,
environment variables, webhooks, and deployment history. These actions remove
hosting but do not remove the existing CDK application stack, RDS database, or
`CDKToolkit`.

Deletion is irreversible for Amplify deployment history and requires explicit
approval. Revert the API `FRONTEND_URL`/CDK parameter separately if the
frontend origin is retired.

## Cost notes

Amplify Hosting is usage-based. Build minutes, stored deployment artifacts,
data transfer, and optional features can consume Free Plan credits or incur
charges. Keep the existing AWS Budget alerts active, use the Standard build
instance, avoid unnecessary rebuilds and preview branches, and remove unused
deployments. A managed Amplify hostname and certificate avoid Route 53/domain
costs for this first staging frontend; no custom DNS or ACM resource is part of
this procedure.
