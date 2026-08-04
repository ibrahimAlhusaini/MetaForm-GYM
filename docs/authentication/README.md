# MetaForm GYM Backend Authentication

## Architecture

Authentication uses short-lived JWT access tokens, rotating persisted JWT refresh tokens, bcrypt password hashes, Zod request validation, and Prisma transactions. Access tokens are returned in JSON and sent by clients as Bearer tokens. Refresh tokens are sent only through an HttpOnly cookie and only their SHA-256 hashes are stored in PostgreSQL.

The current deployment assumption is that the web application and API are same-site, including local development on different ports. The refresh cookie therefore uses `SameSite=Lax`; production also enables `Secure`.

## Login sequence

```mermaid
sequenceDiagram
  participant Client
  participant API
  participant DB as PostgreSQL

  Client->>API: POST /auth/login (email, password)
  API->>DB: Find normalized email
  API->>API: bcrypt comparison
  API->>DB: Persist refresh-token hash
  API-->>Client: Access token JSON + HttpOnly refresh cookie
```

Unknown emails still perform a bcrypt comparison and return the same message as an incorrect password.

## Refresh-token rotation

```mermaid
sequenceDiagram
  participant Client
  participant API
  participant DB as PostgreSQL

  Client->>API: POST /auth/refresh + refresh cookie
  API->>API: Verify signature, expiry, issuer, audience, type
  API->>DB: Load session by jti
  API->>API: Constant-time hash comparison
  API->>DB: Transaction: revoke old session and create replacement
  API-->>Client: New access token JSON + replacement HttpOnly cookie
```

The transactional conditional revoke prevents two concurrent requests from successfully rotating the same token. Reuse of a revoked token returns HTTP 401.

## Logout

```mermaid
sequenceDiagram
  participant Client
  participant API
  participant DB as PostgreSQL

  Client->>API: POST /auth/logout + refresh cookie
  API->>DB: Revoke matching active session
  API-->>Client: Clear refresh cookie
```

Logout is idempotent. Access tokens are not server-side sessions and remain valid until their short expiration, currently 15 minutes.

## Endpoints

| Method | Endpoint                | Authentication          | Purpose                                     |
| ------ | ----------------------- | ----------------------- | ------------------------------------------- |
| POST   | `/api/v1/auth/register` | Public, rate limited    | Create user, profile, and session           |
| POST   | `/api/v1/auth/login`    | Public, rate limited    | Verify credentials and create session       |
| POST   | `/api/v1/auth/refresh`  | Refresh cookie          | Rotate refresh token and issue access token |
| POST   | `/api/v1/auth/logout`   | Optional refresh cookie | Revoke session and clear cookie             |
| GET    | `/api/v1/auth/me`       | Bearer access token     | Return current active user                  |

## Cookie behavior

- Name: configured by `COOKIE_NAME`
- Path: `/api/v1/auth`
- HttpOnly: always
- SameSite: `Lax`
- Secure: production only
- Max age: matches refresh-token expiration

Frontend requests to refresh and logout must enable credentials. The access token must remain outside cookies and be sent in the `Authorization: Bearer <token>` header.

## Environment variables

| Variable                 | Purpose                                                   |
| ------------------------ | --------------------------------------------------------- |
| `DATABASE_URL`           | Development PostgreSQL connection                         |
| `TEST_DATABASE_URL`      | Dedicated integration-test database ending in `_test`     |
| `FRONTEND_URL`           | Single allowed CORS origin                                |
| `JWT_ACCESS_SECRET`      | Access-token HMAC secret, minimum 32 characters           |
| `JWT_REFRESH_SECRET`     | Separate refresh-token HMAC secret, minimum 32 characters |
| `JWT_ACCESS_EXPIRES_IN`  | Access lifetime, default `15m`                            |
| `JWT_REFRESH_EXPIRES_IN` | Refresh lifetime, default `7d`                            |
| `BCRYPT_ROUNDS`          | Password hashing cost, default `12`                       |
| `COOKIE_NAME`            | Refresh-cookie name                                       |

Generate independent local secrets in PowerShell without printing them into committed files:

```powershell
node.exe -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run the command twice and place the values only in `apps/api/.env`. Never reuse the access and refresh secrets. Rotate the PostgreSQL password that was previously present in `.env.example`.

## Integration tests

Tests require a dedicated database, for example `metaform_gym_test`. Apply migrations to it before running tests. The test guard rejects any database whose name does not end in `_test`.

```powershell
$env:TEST_DATABASE_URL='postgresql://postgres:YOUR_PASSWORD@localhost:5432/metaform_gym_test?schema=public'
$env:DATABASE_URL=$env:TEST_DATABASE_URL
npm.cmd exec --workspace @metaform/api -- prisma migrate deploy
npm.cmd run test:auth --workspace @metaform/api
```

Tests delete only their users from the dedicated test database. They never reset or truncate `metaform_gym`.

## Security decisions and future improvements

- HS256 tokens constrain algorithm, issuer, audience, expiration, and token type.
- JWT payloads contain identifiers and role only; profile data is never embedded.
- Refresh hashes use SHA-256 and constant-time comparison.
- Login and registration use independent in-memory rate limiters. A shared Redis-backed limiter is required before horizontally scaling the API.
- Logout does not revoke already issued access tokens. A denylist or token-version strategy can be added if immediate access revocation becomes necessary.
- Rotation rejects replay but does not yet revoke an entire token family after replay detection.
- SameSite cookies mitigate common CSRF scenarios. Explicit CSRF tokens should be added if the frontend and API move to a cross-site architecture.
- Email verification, password recovery, OAuth, two-factor authentication, role management, and device/session management are intentionally postponed.
