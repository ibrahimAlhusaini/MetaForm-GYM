# Containerization and AWS CDK Preparation

Status: local/offline staging preparation complete; AWS deployment is not
authorized. Default region: Europe (Frankfurt), `eu-central-1`.

This stage adds production-oriented Express and FastAPI images, a local
two-container smoke topology, and a staging-only AWS CDK v2 TypeScript stack.
It creates no AWS resources and does not change the normal `npm run dev`
workflow or the frozen Research Preview protocols.

## What exists and what does not

Created locally:

- a multi-stage Node 22 API Dockerfile with workspace/shared-types builds,
  Prisma generation, production-only runtime dependencies, and a non-root
  runtime;
- a separate `migration` image target whose only default command is
  `prisma migrate deploy`; migrations never run in API startup;
- a Python 3.12 multi-stage image that installs the base `pyproject.toml`
  package without the `dev` extra and runs Uvicorn as a non-root user;
- focused Docker context exclusions and a small Compose smoke topology;
- the standalone `infrastructure/` CDK workspace, assertion tests, and a
  synthesized staging CloudFormation template.

Not created or deployed: CDK bootstrap resources, ECR repositories or pushed
images, VPC/ECS/RDS/ALB/Secrets Manager resources, Amplify, Route 53, ACM,
GitHub OIDC, CI deployment workflows, or any production stack. No AWS deploy,
CloudFormation deploy, bootstrap, or asset publication command was run.

## Images and local smoke tests

The API build context is the repository root because npm workspaces and
`@metaform/shared-types` are required. `.dockerignore` admits only the relevant
root/package/API/shared-types inputs and excludes `.env*`, Git metadata,
`node_modules`, rebuilt output, the web application, data science, docs, logs,
coverage, dumps, and local tooling state. Prisma generation uses a non-secret,
non-routable build placeholder and never connects to a database.

The final API image contains production dependencies and compiled API/shared
types only. It runs as `node`, sets `NODE_ENV=production`, exposes 3000, and
preserves the application's SIGTERM/SIGINT shutdown path and 10-second database
disconnect deadline. Native dependency install scripts remain enabled because
`bcrypt` requires its locked `node-gyp-build` install step. The migration target
is intentionally separate and contains Prisma CLI/schema/migrations.

The final FastAPI image contains the installed base package only—no Jupyter,
pytest, mypy, Ruff, notebooks, artifacts, database settings, OpenAI settings,
auth data, users, or model/data files. It runs Uvicorn on `0.0.0.0:8001` as the
dedicated `metaform` user. Binding all interfaces inside the container does not
make it public by itself; exposure is controlled by Docker/ECS networking.

Docker Desktop is not installed on the current Windows 10 machine, so these
runtime commands remain pending:

```powershell
npm.cmd run docker:build:api
npm.cmd run docker:build:migration
npm.cmd run docker:build:prediction
npm.cmd run docker:smoke
```

`docker:smoke` builds and starts both containers, checks FastAPI `/health`,
checks Express `/api/v1/health`, and performs a Node-side request through
`BODY_WEIGHT_PREDICTION_SERVICE_URL`. It always runs Compose cleanup. The smoke
database URL points to `host.docker.internal`, but core health and the network
check do not query PostgreSQL; normal development continues using the existing
host PostgreSQL rather than a new database container.

For Windows 10, install current Docker Desktop with the WSL2 backend preferred.
Hardware virtualization must be enabled, WSL2/kernel components must be
available, and Windows may require a restart. Do not enable or change these
system features automatically. After installation, confirm Linux containers
with `docker version` and `docker compose version` before running the commands.

### Compose hostname versus ECS localhost

Separate Compose services have separate network namespaces, so the API calls
`http://prediction:8001` by Compose service DNS. Containers in the same ECS
Fargate `awsvpc` task share the task network namespace, so the staging task sets
`BODY_WEIGHT_PREDICTION_SERVICE_URL=http://127.0.0.1:8001`. Production code is
not distorted to emulate ECS locally. FastAPI is not an ALB target in either
design.

## CDK workspace and staging resources

`infrastructure/` is deliberately outside the root npm workspaces. It pins
`aws-cdk-lib` 2.263.0, `constructs` 10.8.1, and the local CDK CLI. It uses no
`Vpc.fromLookup`, hosted-zone lookup, account number, or credential file. The
context default and stack environment use `eu-central-1`.

Local review commands:

```powershell
npm.cmd run infra:typecheck
npm.cmd run infra:test
npm.cmd run infra:synth
```

Synthesis hashes both Docker build contexts and emits Docker asset metadata. It
does not push images or create repositories/resources. `cdk.out/` is ignored and
must not be committed.

The synthesized `MetaFormGymStagingStack` models:

- one `10.40.0.0/16` VPC across two AZs;
- two internet-routed public subnets for ALB and public-IP Fargate tasks;
- two isolated database subnets and zero NAT gateways;
- one ECS cluster, one 0.5-vCPU/1-GiB Fargate task definition, and one desired
  task, with sizing centralized in `lib/staging-config.ts`;
- essential Express on 3000 and non-essential FastAPI on 8001 in the same task;
- an internet-facing ALB with a temporary HTTP-only listener, one Express target
  group, and `/api/v1/health` checks;
- RDS PostgreSQL 18.2 on `db.t4g.micro`, Single-AZ, 20-GiB gp3, encrypted,
  private, one-day automated backups for current Free Plan compatibility,
  retained automated backups, and final-snapshot removal policy. This reduced
  retention is staging-only; production requires a stronger reviewed policy;
- separate Express/FastAPI log groups with 14-day retention;
- deploy-time-generated RDS, JWT access, and JWT refresh secrets;
- separate ECS execution and application task roles. The execution role has
  only the standard ECR-pull/CloudWatch-log policy plus secret-read grants that
  CDK derives from container secret references. The task role has no application
  AWS permissions by default.

No production resources are defined. Container memory must be measured before
deployment because scientific packages may require a larger task; the current
size is a cost-conscious staging hypothesis, not capacity evidence.

## Network and security ownership

The ALB security group accepts public IPv4 TCP/80 only for this offline model and
can egress only to the ECS security group on 3000. The ECS group accepts 3000
only from the ALB group, has no 8001 ingress, and permits outbound PostgreSQL to
the RDS group, HTTPS for ECR/AWS APIs/OpenAI, and VPC DNS under the approved
no-NAT public-IP model. The RDS group
accepts 5432 only from the ECS group and has no public address. A public task IP
provides outbound routing; it does not bypass the task security group or create
direct inbound access.

HTTP is synthesis-safe while the domain is undecided. Before public staging
acceptance, select a domain, issue/validate an ACM certificate in Frankfurt,
add HTTPS 443, redirect HTTP to HTTPS, and create the Route 53 record. Do not
mistake the current HTTP listener for an acceptance-ready edge.

## Database and secrets

PostgreSQL 18 was selected because the local installation is PostgreSQL 18 and
the current Prisma support matrix includes PostgreSQL 18. CDK pins RDS 18.2.
This is compatibility evidence, not a substitute for future container-to-RDS
TLS, migration, restore, and regression tests.

RDS generates and owns username/password plus its endpoint attachment in
Secrets Manager. ECS injects `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`,
`DATABASE_USER`, and `DATABASE_PASSWORD` as secret references. The API remains
backward-compatible with `DATABASE_URL`; when it is absent it safely URL-encodes
the split fields, adds `sslmode=require`, exports only the constructed URL to the
Prisma boundary, and discards the split password field from parsed config. This
avoids a password-bearing URL in CloudFormation environment variables.

JWT secrets are independently generated at deploy time, not at synth time.
Secret values never appear in outputs. OpenAI is disabled by default. A later
synth can enable it only when both `metaform:openAiSecretArn` and
`metaform:aiCoachModel` are explicitly provided; no key or fake model value is
created. AI Coach therefore retains its safe provider-unavailable behavior.

## Images, migrations, frontend, and rollback

The stack uses CDK Docker image assets rather than defining standalone ECR
repositories now. After an explicitly authorized CDK bootstrap, future deploys
would build and publish content-addressed assets to the CDK bootstrap asset
repository. Before that stage, decide whether dedicated immutable/scanned ECR
repositories and digest promotion are preferable. Never push mutable `latest`
as release evidence.

Run migrations as a separate one-off ECS task using the migration image target,
after a verified backup/snapshot and before the new service revision. Never run
`prisma migrate dev`, `reset`, test DB tooling, or automatic startup migrations
against staging. Image rollback does not reverse schema changes; use compatible
expand/contract migrations and a reviewed corrective migration or incident-led
snapshot restore.

Amplify is deferred because no repository credential/domain is selected. A
later phase configures the SPA, only the public `VITE_API_URL`, SPA fallback,
Frankfurt control plane, domain, and HTTPS. Do not store GitHub tokens; future
CI/CD uses GitHub OIDC and short-lived AWS roles.

Destroying staging should first stop traffic and preserve evidence. The CDK
policy destroys bounded container log groups but requests an RDS final snapshot
and retains automated backups. Review generated snapshot names, secret removal,
bootstrap assets, DNS/certificates, and ECR lifecycle separately. Database
rollback is not equivalent to compute rollback.

## Future AWS-mutating sequence — DO NOT RUN YET

The following is an exact operator outline, not current authorization. Replace
placeholders, review `cdk diff`, current prices, IAM, domain/TLS, backups,
container evidence, and the synthesized template first.

```powershell
# DO NOT RUN YET — creates CDK bootstrap AWS resources.
npx --prefix infrastructure cdk bootstrap aws://<ACCOUNT_ID>/eu-central-1 --profile metaform

# DO NOT RUN YET — builds/publishes Docker assets and creates staging resources.
npm.cmd run infra:synth
npx --prefix infrastructure cdk diff MetaFormGymStagingStack --profile metaform
npx --prefix infrastructure cdk deploy MetaFormGymStagingStack --profile metaform --require-approval broadening
```

After a future infrastructure deployment, build/publish/record immutable image
digests as selected, run the one-off migration task, deploy the service revision,
verify core/database/Python health and graceful replacement, then configure
ACM/HTTPS/DNS and Amplify. None of those steps was executed here.

## Cost and remaining gates

The design avoids NAT gateway hourly/data charges, a second load balancer, a
second ECS service, Multi-AZ RDS, WAF, interface endpoints, X-Ray/OpenSearch,
Route 53, ACM, and Amplify in this stack. Material ongoing costs after deployment
would still include ALB hours/LCUs and public IPv4 addresses, Fargate, RDS,
storage/backups, Secrets Manager, logs, ECR assets, and transfer. Refresh the
Frankfurt estimate immediately before authorization and compare the first bill
to the existing budget.

The current `aws-cdk-lib` 2.263.0 bundle includes `brace-expansion` 5.0.8,
which npm audit reports under high-severity denial-of-service advisory
GHSA-rgw5-rvv9-x895. `npm audit fix` cannot replace it because it is bundled by
the current CDK release. This local synthesis dependency is not copied into
either application image, and no untrusted glob input is accepted here. Upgrade
to the first compatible CDK release that bundles 5.0.9 or later, then rerun all
assertions and synth, before bootstrap.

Before the first bootstrap: install/validate Docker Desktop; pass both image
builds, non-root/config inspection, health, Node-to-Python, graceful-stop, and
vulnerability smokes; select the AWS account ID only at the command line; review
bootstrap trust; refresh Frankfurt pricing; approve monthly limits; decide ECR
ownership; select domain/ACM/DNS; verify the MFA session; review the stack diff;
and obtain explicit AWS-mutating authorization.
