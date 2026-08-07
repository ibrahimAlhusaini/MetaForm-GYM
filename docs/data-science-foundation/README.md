# Python Data Science Foundation and EDA Pipeline

The implementation is maintained in [`data-science/`](../../data-science/README.md).
It is deliberately isolated from the Node/React runtime and Prisma migrations.

## Data flow

```mermaid
flowchart LR
  P[(Prisma-managed PostgreSQL)] -->|read-only SELECT| X[Explicit extraction SQL]
  X --> A[Immediate pseudonymization]
  A --> D[Five stable dataframe contracts]
  D --> Q[Reusable quality reports]
  D --> F[Reusable preprocessing/features]
  Q --> N[Deterministic EDA notebooks]
  F --> N
```

## Privacy flow

```mermaid
flowchart TD
  Scope[Fitness tables only] --> Select[Explicit safe columns]
  Excluded[User/auth/tokens/names/notes excluded] --> Select
  Select --> Raw[Raw UUID exists briefly in memory]
  Raw --> HMAC[Domain-separated HMAC/SHA-256 pseudonym]
  HMAC --> Guard[Forbidden-column export guard]
  Guard --> Analysis[Analysis-ready dataframe]
```

Pseudonyms permit longitudinal grouping but are not anonymous. Custom-machine
names and all free text are excluded because users can enter identifying content.
No user dataset is committed, and generated data formats are ignored.

## Future training and evaluation

```mermaid
flowchart LR
  History[Ordered user history] --> Past[Past-only lags and rolling values]
  Past --> Boundary[Chronological boundary]
  Boundary --> Earlier[Earlier training window]
  Boundary --> Later[Later evaluation window]
  Earlier --> Fit[Future baseline fit]
  Fit --> Later
```

This foundation stops before `model.fit`. It establishes typed contracts,
causal-feature tests, and chronological splitting so the future ML stage has an
auditable leakage boundary. See the workspace README for setup, dataset details,
quality behavior, notebook operation, limitations, and the next recommended stage.

