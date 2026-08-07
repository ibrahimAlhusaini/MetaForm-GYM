# MetaForm GYM

Production-oriented fitness analytics monorepo foundation. This stage contains only the application shell, API infrastructure, PostgreSQL/Prisma configuration, and health check.

The independent read-only Python analytics and EDA workspace is documented in
[`data-science/README.md`](data-science/README.md). It is intentionally not an npm
workspace and does not alter application runtime behavior.

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer
- Local PostgreSQL on `localhost:5432`
- A PostgreSQL database named `metaform_gym`

## Setup

1. Install dependencies: `npm install`
2. Copy `apps/api/.env.example` to `apps/api/.env`
3. Replace `YOUR_PASSWORD` in the copied file with your local PostgreSQL password
4. Generate the Prisma client: `npm run prisma:generate`
5. Start both applications: `npm run dev`

The frontend runs at `http://localhost:5173`. The API runs at `http://localhost:3000`, and its health check is available at `http://localhost:3000/api/v1/health`.

## Workspace commands

- `npm run dev:web` — frontend only
- `npm run dev:api` — backend only
- `npm run build` — production builds
- `npm run typecheck` — strict TypeScript checks
- `npm run lint` — ESLint checks
- `npm run format:check` — Prettier checks
- `npm run prisma:migrate -- --name <migration-name>` — create a development migration after models are added
- `npm run prisma:studio` — open Prisma Studio
