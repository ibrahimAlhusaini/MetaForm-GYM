# MetaForm GYM

Production-oriented fitness analytics monorepo with an authenticated application,
read-only analytics workspace, and a body-weight trend Research Preview.

The independent Python analytics, evaluation, and focused prediction runtime is
documented in [`data-science/README.md`](data-science/README.md). It remains
outside the npm workspaces; Node calls only its explicit local FastAPI boundary.

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
5. Install the Python workspace: `cd data-science; .\.venv\Scripts\python.exe -m pip install -e ".[dev]"; cd ..`
6. Start the prediction runtime: `npm run dev:prediction`
7. In another terminal, start the web and API applications: `npm run dev`

The frontend runs at `http://localhost:5173`. The API runs at `http://localhost:3000`, and its health check is available at `http://localhost:3000/api/v1/health`.
The optional local prediction service runs at `http://127.0.0.1:8001`; the
core application remains usable when this Research Preview is unavailable.

## Workspace commands

- `npm run dev:prediction` — local Body Weight Research Preview service
- `npm run dev:all` — web, API, and prediction service together

- `npm run dev:web` — frontend only
- `npm run dev:api` — backend only
- `npm run build` — production builds
- `npm run typecheck` — strict TypeScript checks
- `npm run lint` — ESLint checks
- `npm run format:check` — Prettier checks
- `npm run prisma:migrate -- --name <migration-name>` — create a development migration after models are added
- `npm run prisma:studio` — open Prisma Studio
