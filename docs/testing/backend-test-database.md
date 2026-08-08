# Backend test database

Backend integration tests use a dedicated local PostgreSQL database named
`metaform_gym_test`. Never point `TEST_DATABASE_URL` at the development
database (`metaform_gym`) or at a database containing real user data.

## Safety model

`TEST_DATABASE_URL` is required by database integration tests and test database
commands. It is not required for normal development startup, and test tooling
never falls back to `DATABASE_URL`.

Before changing data, the shared guard:

- requires a PostgreSQL URL and exactly one database name;
- explicitly rejects `metaform_gym`;
- requires a delimited `test` marker in the database name;
- rejects a target that resolves to the same host, port, and database as
  `DATABASE_URL`;
- rejects obvious production or staging hostnames; and
- reports validation failures without printing credentials.

The full backend suite runs serially. Its existing per-test cleanup deletes
synthetic records in foreign-key-safe order, while test preparation performs
one guarded Prisma reset before the suite. It does not drop the database before
each test and does not copy development data.

## Windows PowerShell setup

From the repository root:

```powershell
cd "C:\MetaForm GYM"
$env:TEST_DATABASE_URL = "postgresql://<user>:<password>@localhost:5432/metaform_gym_test?schema=public"
npm run test:db:create
npm run test:db:prepare
npm run test:api
```

Replace the placeholders only in your PowerShell session or in the ignored
`apps/api/.env` file. Do not commit a real URL or password. `test:db:create`
connects to PostgreSQL's `postgres` maintenance database and creates
`metaform_gym_test` only if it is absent. PostgreSQL may require the configured
role to have `CREATEDB`; use one of the manual methods below if it does not.

`test:db:prepare` first runs the guard tests, then invokes
`prisma migrate reset --force` with `DATABASE_URL` overridden in the child
process to the already-validated `TEST_DATABASE_URL`. This clears only the test
schema and applies the existing migration history. `npm run test:api` performs
the same preparation automatically before running the complete API suite.

To run the body measurement, prediction, and dashboard latest-weight coverage
only:

```powershell
npm run test:body-weight --workspace @metaform/api
```

## Create the database with pgAdmin

1. Connect to the local PostgreSQL server in pgAdmin.
2. Right-click **Databases**, choose **Create > Database**.
3. Enter `metaform_gym_test` as the database name and select the local API role
   as owner.
4. Save, then set `TEST_DATABASE_URL` and run `npm run test:db:prepare`.

Do not clone `metaform_gym`, restore a development dump, or use a production
backup as the test database.

## Create the database with PostgreSQL CLI

The PostgreSQL installer does not always add its tools to `PATH`. For the local
PostgreSQL 18 installation, run:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" `
  --host localhost --port 5432 --username <user> metaform_gym_test
```

The command prompts for a password when the local authentication configuration
requires one. Do not place the password in shell history or a repository file.

## Troubleshooting

- **`TEST_DATABASE_URL is required`**: set it in the current PowerShell session
  or in ignored `apps/api/.env`; `DATABASE_URL` is intentionally not reused.
- **Unsafe database/host error**: use the exact local database name
  `metaform_gym_test` and confirm it differs from `DATABASE_URL`.
- **Database does not exist**: run `npm run test:db:create`, or create it with
  pgAdmin/`createdb`.
- **Permission denied to create database**: create it once through pgAdmin or a
  PostgreSQL role with `CREATEDB`; application tests need ordinary schema
  migration permissions afterward.
- **Connection refused/authentication failed**: start the local PostgreSQL
  service and verify the host, port, user, and password without pasting the URL
  into logs or issue reports.
- **Schema drift or stale test rows**: rerun `npm run test:db:prepare`. The reset
  is destructive by design and is permitted only after the guard accepts the
  isolated test target.
