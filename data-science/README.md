# MetaForm GYM Data Science Foundation

This independent Python 3.12 workspace provides read-only analytical extraction,
privacy-preserving dataset contracts, quality reports, causal feature utilities,
deterministic synthetic fixtures, and exploratory notebooks. It is not an npm
workspace and contains no model training or production prediction path.

## Windows PowerShell setup

Install Python 3.12, then run:

```powershell
cd "C:\MetaForm GYM\data-science"
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
Copy-Item .env.example .env
```

Edit `.env` locally. The preferred URL uses a PostgreSQL role granted only
`CONNECT`, `USAGE` on the application schema, and `SELECT` on required tables:

```text
DATA_SCIENCE_DATABASE_URL=postgresql+psycopg://readonly_user:...@localhost:5432/metaform_gym
DATA_SCIENCE_ANONYMIZATION_SECRET=a-long-random-local-secret
DATA_SCIENCE_ARTIFACT_DIR=artifacts
DATA_SCIENCE_SYNTHETIC_SEED=20260807
```

The Python process never loads the Node `.env`. Credentials are not hardcoded,
and `.env` is ignored. Configuration can load without a database URL so pure
tests and synthetic notebooks remain usable; extraction fails clearly if the URL
is missing or is not PostgreSQL.

## Read-only and privacy rules

`metaform_ds.db` is the only database boundary. It accepts a single `SELECT` or
`WITH` statement, rejects write/DDL keywords, configures PostgreSQL's
`default_transaction_read_only`, executes `SET TRANSACTION READ ONLY`, and always
rolls the transaction back. This supplements—rather than replaces—a SELECT-only
database role. The workspace has no insert, update, migration, or ORM model API.

Queries never select `email`, `passwordHash`, `fullName`, role, tokens, IP,
user-agent, notes, profile image, or AI-coach content. User, session, and strength
source UUIDs are pseudonymized immediately and removed. Standard exercise names
are catalog data; custom-machine names are user-authored and intentionally null.

With `DATA_SCIENCE_ANONYMIZATION_SECRET`, identifiers use domain-separated
HMAC-SHA-256. Without it they use domain-separated SHA-256 for disposable local
analysis. The fallback is stable but vulnerable to offline candidate checking.
Neither method is full anonymization: longitudinal data can still be identifying
when combined with outside knowledge. Never commit raw or generated user data.

## Architecture and dataset contracts

```mermaid
flowchart LR
  DB[(PostgreSQL / Prisma source)] --> RO[SELECT-only extraction]
  RO --> C[Stable pandas contracts]
  C --> Q[Quality reports]
  C --> P[Preprocessing and causal features]
  Q --> E[EDA notebooks]
  P --> E
```

```mermaid
flowchart LR
  UUID[Raw UUID in query result] --> RAM[Immediate in-memory transform]
  Secret[Environment HMAC secret] --> RAM
  RAM --> Pseudo[Domain-separated pseudonym]
  RAM --> Drop[Drop raw UUID]
  Pseudo --> Safe[Contract + export guard]
  Drop --> Safe
```

| Dataset | Grain | Key semantics |
|---|---|---|
| Body weight | measurement event | All measurements retained and UTC ordered; same timestamps are reported, not collapsed |
| Strength progression | source per completed session | Non-warmup weighted sets; maximum load represents a session; volume uses stored weight and reps |
| Workout activity | workout session | Completed only by default; incomplete rows optional and duration null; negative malformed durations reported |
| Nutrition | stored calculation event | Legacy nullable context is retained; formulas are never rerun |
| User fitness context | profile snapshot | Minimal non-identifying values; age follows UTC calendar semantics |

Ordered columns and nullable pandas dtypes live in `metaform_ds.contracts`. Empty
queries return those exact schemas. Quality checks report nulls, duplicates,
duplicate entity timestamps, invalid weights/dates/durations/nutrition values,
source inconsistency, long chronology gaps, and insufficient group histories.
They do not silently clean source facts.

## Preprocessing, features, and leakage

Core transformations live in modules, not notebooks: UTC conversion, safe numeric
conversion, stable chronological sorting, representative strength reduction,
UTC daily and Monday-start weekly aggregation, and elapsed time. Weight and
strength features are intentionally small and explainable.

Every rolling input is shifted one observation before a non-centered rolling
window. Lags use previous rows only. Preparation functions return `features`,
`target`, and pseudonymous/timestamp metadata but never call `fit`. Future
evaluation must split chronologically and must fit any imputer/scaler only on the
training window.

```mermaid
flowchart LR
  Contract[Validated chronological contract] --> Causal[Causal lag/rolling features]
  Causal --> Split[Chronological split]
  Split --> Train[Future train-only fitting]
  Split --> Eval[Later-time evaluation]
  Train --> Eval
```

Random train/test splits are prohibited for user progress. No centered rolling,
future-filled values, full-series normalization, or future-derived aggregates
belong in features.

## Synthetic data and notebooks

When no database URL is configured, notebooks use a complete, clearly labeled
`SYNTHETIC` bundle with a fixed seed. When a URL is configured they use only real
read-only extracts; an empty real dataset stays empty rather than being silently
mixed with synthetic rows. Synthetic data exists only in memory and exposes
`database_written: false` metadata.

Run notebooks from this directory after editable installation:

```powershell
jupyter lab notebooks
```

The first four notebooks cover data overview, body weight, strength progression,
and nutrition/training relationships. Notebook 05 adds the isolated Body Weight
Prediction V1 temporal evaluation. All use matplotlib and tolerate empty/small
data. Synthetic evaluation is labeled as pipeline validation, never real-world
accuracy.

## Body Weight Prediction V1

The evaluation-only V1 predicts an observed body-weight measurement near seven
days ahead (±2 days) after at least five prior measurements. It compares Last
Value and Recent Trend baselines with an interpretable Linear Regression pipeline
using expanding origins and strict target-availability cutoffs. It does not
persist or serve a model. Full design and interpretation rules are documented in
[`docs/body-weight-prediction-v1/README.md`](../docs/body-weight-prediction-v1/README.md).

## Verification

```powershell
ruff check src tests
ruff format --check src tests
mypy src
pytest
python -c "import metaform_ds; print(metaform_ds.__version__)"
jupyter nbconvert --to notebook --execute notebooks\01_data_overview.ipynb --output-dir artifacts
```

The optional database extraction smoke check requires the read-only URL. Tests do
not modify a database. Generated CSV, Parquet, notebook outputs, models, database
dumps, and report output are ignored.

## Future model stage

The next recommended stage, after representative real history is available, is
Body Weight Model Robustness and Calibration: repeated temporal cutoffs, cadence
and history-length error slices, prediction intervals, and comparison with a
regularized linear alternative. Production serving, strength modeling, scheduled
retraining, model registries, and application changes remain later concerns.
