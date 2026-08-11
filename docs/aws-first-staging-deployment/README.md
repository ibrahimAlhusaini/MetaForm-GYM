# AWS First Staging Deployment Manifest

**Review date:** 2026-08-10  
**Scope:** post-bootstrap review and preparation for the first staging deployment  
**Decision:** `READY_FOR_FIRST_STAGING_DEPLOY`

This is approval to proceed to the first controlled staging deployment sequence
only. It is not a record of a deployment, does not approve production use, and
does not make the HTTP-only environment staging acceptance-ready. No deployment,
asset publication, image push, or AWS application-resource mutation was
performed during this review.

## Bootstrap inspection summary

The completed `CDKToolkit` bootstrap was inspected before this review and was
reported as `CREATE_COMPLETE`, bootstrap version 32, qualifier `hnb659fds`, and
termination protection enabled. It contains only the expected staging asset
bucket, container-assets ECR repository, SSM version parameter, publishing,
lookup, deployment, and CloudFormation execution roles and policies. Trusted
accounts and lookup-trusted accounts are empty; no cross-account trust is
configured or approved. The account number is intentionally not recorded.

## CDK identity

- Stack name: `MetaFormGymStagingStack`.
- Entry point: `infrastructure/bin/metaform-gym.ts`.
- CDK app command: `npx tsx bin/metaform-gym.ts` from `infrastructure`.
- Region: explicitly `eu-central-1` in CDK context and staging configuration.
- Default OpenAI integration: disabled.
- CloudFormation parameters:
  - `StagingFrontendUrl`: exact HTTPS browser origin. Its non-routable default,
    `https://staging.example.invalid`, is allowed only while desired count is 0.
    A CloudFormation rule requires a different real HTTPS origin before desired
    count can be 1.
  - `StagingDesiredCount`: allowed values 0 or 1; defaults to 0 so migrations
    must succeed before an application task starts.

## Exact planned resources

The synthesized application template contains the resources below. CDK
metadata is omitted from the functional inventory.

### Network

- One VPC, `10.40.0.0/16`, with DNS support and hostnames enabled.
- Two public `/24` subnets across two Availability Zones:
  `10.40.0.0/24` and `10.40.1.0/24`; public-IP mapping is enabled.
- Two isolated database `/24` subnets across the same two Availability Zones:
  `10.40.2.0/24` and `10.40.3.0/24`; public-IP mapping is disabled.
- Four route tables and four subnet associations.
- One Internet Gateway and one VPC gateway attachment.
- Two `0.0.0.0/0` public-subnet routes to the Internet Gateway.
- Zero NAT Gateways and no route from either database subnet to the Internet.
- Three security groups:
  - ALB: public IPv4 ingress on TCP/80 only; egress only to ECS TCP/3000.
  - ECS: ingress only from the ALB security group on TCP/3000; egress to the
    database security group on TCP/5432, public HTTPS on TCP/443, and VPC DNS
    on TCP/UDP 53.
  - Database: ingress only from the ECS security group on TCP/5432 and no
    useful outbound rule.
- Application and migration tasks use public subnets and must receive a public
  IP for ECR, Secrets Manager, logging, and AWS API access. Their security group
  does not allow public inbound traffic.

### Compute

- One ECS cluster named `metaform-gym-staging`; Container Insights is disabled.
- One application Fargate task definition, family `metaform-gym-staging`:
  - Linux/X86 Fargate, `awsvpc` networking.
  - 0.5 vCPU (`512`) and 1 GiB (`1024` MiB) task memory.
  - Express: essential, 256 CPU units, 512 MiB reservation, port 3000, non-root
    `node` user, 15-second stop timeout.
  - FastAPI prediction sidecar: non-essential by design, 256 CPU units,
    384 MiB reservation, port 8001, non-root `metaform` user.
  - Express calls FastAPI over `http://127.0.0.1:8001`; port 8001 has no ALB
    target and no security-group ingress.
  - The sidecar health command calls `127.0.0.1:8001/health`, with a 20-second
    start period, 30-second interval, 5-second timeout, and three retries.
  - Express depends on sidecar `START`, not `HEALTHY`. The API is designed to
    degrade safely when the research-preview prediction service is unavailable.
- One isolated one-off migration Fargate task definition, family
  `metaform-gym-staging-migration`, with 0.25 vCPU and 512 MiB task memory. It
  runs as non-root `node`, has no listening port, and is never scheduled by
  CloudFormation automatically.
- One ECS service named `metaform-gym-staging`, with deployment circuit-breaker
  rollback, 60-second health grace period, minimum healthy 0%, maximum 200%,
  and parameterized desired count. The first deploy must use desired count 0.

### Load balancing

- One internet-facing Application Load Balancer across both public subnets.
- One public HTTP listener on port 80 and no HTTPS listener or certificate.
- One IP target group for Express on port 3000.
- Target health path `/api/v1/health`, HTTP 200, 30-second interval, 5-second
  timeout, and 15-second deregistration delay.
- Only Express is registered. FastAPI is not externally exposed.
- The ALB security group permits `0.0.0.0/0` on TCP/80. This is acceptable only
  for a tightly controlled technical staging smoke. HTTPS/ACM is required
  before staging acceptance; this configuration is not production-ready.

### Database

- One Single-AZ RDS PostgreSQL 18.2 instance, currently confirmed available and
  orderable as `db.t4g.micro` in `eu-central-1`.
- Database name `metaform_gym`, 20 GiB gp3, encrypted storage, automatic minor
  upgrades enabled, and no public accessibility.
- The DB subnet group contains only the two isolated database subnets.
- One-day automated-backup retention, preserving point-in-time recovery while
  remaining compatible with this account's AWS Free Plan. This is a staging
  account-plan/cost constraint, not a production recommendation. Production
  should use a reviewed stronger retention policy, initially 14 days and
  potentially 14-35 days according to RPO and compliance requirements.
- Automated backups are not requested to be deleted with the instance.
- Deletion protection is disabled for economical staging. CloudFormation
  deletion and replacement policies are `Snapshot`, so rollback or cleanup can
  leave a chargeable retained snapshot.
- PostgreSQL ingress is only from the ECS security group on TCP/5432. Neither a
  public password nor public database access is required for migrations.

### Secrets

Three Secrets Manager resources are generated during deployment:

1. RDS credentials: generated username/password, then attached to RDS so the
   JSON secret includes host, port, database name, username, and password.
2. JWT access signing secret: 64-character deploy-time-generated value.
3. JWT refresh signing secret: 64-character deploy-time-generated value.

The application execution role can retrieve the exact RDS and two JWT secrets.
The separate migration execution role can retrieve only the exact RDS secret.
The application/migration task role has no secret or other AWS permissions.
Secret values are dynamic references or ECS secret references; no values or
database URLs are committed or embedded in the template or images.

### Logging

- `/metaform-gym/staging/express`: Express and migration streams.
- `/metaform-gym/staging/prediction`: FastAPI streams.
- Both retain logs for 14 days and use a destroy removal policy.
- Each execution role can create streams and write only to the log groups its
  task uses. Neither application container receives CloudWatch API permission.

### IAM

- Application task role: assume-role trust for ECS tasks and no attached or
  inline application permissions.
- Application execution role: standard managed ECS task-execution policy plus
  exact container-asset ECR pull, both log groups, and all three generated
  secrets.
- Migration execution role: standard managed ECS task-execution policy plus
  exact container-asset ECR pull, the Express/migration log group, and only the
  RDS secret.
- ECR layer/download actions are scoped to the `hnb659fds` bootstrap container
  asset repository. `ecr:GetAuthorizationToken` uses `Resource: "*"` because
  that ECR action does not support repository resource scoping.
- No application or migration role has `Action: "*"`, IAM administration, or
  `AdministratorAccess`. The separately accepted bootstrap CloudFormation role
  remains a deployment role, not an application runtime role.

### Container assets

CDK will build three distinct Docker assets:

1. FastAPI from `data-science/Dockerfile`, final runtime stage.
2. Express API from `apps/api/Dockerfile`, final runtime stage.
3. Prisma migration from `apps/api/Dockerfile`, target `migration`.

Before CloudFormation deployment, the CDK asset publisher builds missing assets
and pushes content-addressed tags to
`cdk-hnb659fds-container-assets-<ACCOUNT_ID>-eu-central-1`. No manual repository,
tagging, login, or `docker push` is required. The bootstrap ECR repository is
shared for CDK assets; the application stack does not create another ECR
repository.

The migration image uses a pinned, isolated Prisma dependency lock, is about
149 MB, runs as `node`, and contains no npm/npx, compiler, make, or Git
executable. Its local scan reports only the same two critical and two high
upstream-unfixed Debian Perl findings accepted for staging. A prior full
development-dependency version was rejected because it contained a fixable
critical `tar` vulnerability and multiple fixable high tool vulnerabilities.

## Deterministic database migration strategy

The stack intentionally does **not** run migrations automatically and the API
does not migrate on startup. Instead, the first stack deployment creates the
private database, generated secret, scoped migration task definition, cluster,
and service resource with desired count 0. The migration task:

- receives the five RDS connection fields through ECS secret injection;
- constructs an encoded PostgreSQL URL with `sslmode=require` in memory;
- runs `prisma migrate deploy` directly through the pinned Prisma CLI;
- writes output to the Express log group under the `migration` prefix; and
- returns the Prisma exit status as the ECS container/task exit status.

It fails closed if any secret field is absent. Do not use `migrate dev`, reset,
force-reset, schema push, a public database, or a manually copied password. Do
not run two migration tasks concurrently. A failed migration leaves the service
at zero tasks for diagnosis and a deliberate fix-forward decision.

## Required deployment order

1. Bootstrap is already complete and remains unchanged.
2. Reconfirm profile, account out of band, region, cost alert state, clean diff,
   tests, audit, and synth.
3. Deploy the stack with `StagingDesiredCount=0`. CDK builds/publishes all three
   assets, then CloudFormation creates network, IAM, logs, secrets, RDS, ALB,
   task definitions, and a zero-task ECS service.
4. Require stack `CREATE_COMPLETE` and RDS `available`.
5. Run exactly one migration task using the synthesized stack outputs and the
   ECS security group/public subnets. Assign a public IP; there is no NAT.
6. Wait for the task to stop, require migration container exit code 0, and
   inspect the migration log stream. Do not proceed merely because the task
   reached `STOPPED`.
7. Deploy the same stack with `StagingDesiredCount=1` and the same frontend
   origin. The ECS deployment circuit breaker governs service activation.
8. Validate ALB health, explicit database health, sidecar container health,
   logs, target health, and a controlled Node-to-FastAPI prediction workflow.

## Proposed commands — DO NOT RUN during this review

First infrastructure deployment, service stopped:

```powershell
npx --prefix infrastructure cdk deploy MetaFormGymStagingStack --profile metaform --region eu-central-1 --require-approval broadening --parameters "MetaFormGymStagingStack:StagingDesiredCount=0"
```

One-off migration task after the first stack reaches `CREATE_COMPLETE`:

```powershell
$stack = aws cloudformation describe-stacks --stack-name MetaFormGymStagingStack --profile metaform --region eu-central-1 --output json | ConvertFrom-Json
$outputs = @{}
$stack.Stacks[0].Outputs | ForEach-Object { $outputs[$_.OutputKey] = $_.OutputValue }
$network = @{
  awsvpcConfiguration = @{
    subnets = @($outputs.StagingPublicSubnetIds -split ',')
    securityGroups = @($outputs.StagingEcsSecurityGroupId)
    assignPublicIp = 'ENABLED'
  }
} | ConvertTo-Json -Compress -Depth 4
$result = aws ecs run-task --cluster $outputs.StagingClusterName --task-definition $outputs.StagingMigrationTaskDefinitionArn --launch-type FARGATE --count 1 --network-configuration $network --profile metaform --region eu-central-1 --output json | ConvertFrom-Json
if ($result.failures.Count -ne 0 -or $result.tasks.Count -ne 1) { throw 'Migration task did not start exactly once' }
$migrationTask = $result.tasks[0].taskArn
aws ecs wait tasks-stopped --cluster $outputs.StagingClusterName --tasks $migrationTask --profile metaform --region eu-central-1
$stopped = aws ecs describe-tasks --cluster $outputs.StagingClusterName --tasks $migrationTask --profile metaform --region eu-central-1 --output json | ConvertFrom-Json
$migration = $stopped.tasks[0].containers | Where-Object name -eq 'migration'
if ($migration.exitCode -ne 0) { throw "Migration failed with exit code $($migration.exitCode)" }
```

Application activation only after migration exit code 0:

```powershell
npx --prefix infrastructure cdk deploy MetaFormGymStagingStack --profile metaform --region eu-central-1 --require-approval broadening --parameters "MetaFormGymStagingStack:StagingDesiredCount=1" --parameters "MetaFormGymStagingStack:StagingFrontendUrl=https://<STAGING_FRONTEND_HOST>"
```

The second command must use the real deployed frontend's exact HTTPS origin.
The sentinel cannot activate the service, and wildcard or path-bearing origins
remain invalid.

## Immediate post-deployment checks

Use read-only commands after each future mutation. Do not print secret values.

```powershell
aws cloudformation describe-stacks --stack-name MetaFormGymStagingStack --profile metaform --region eu-central-1 --query "Stacks[0].StackStatus"
aws rds describe-db-instances --db-instance-identifier metaform-gym-staging-postgres --profile metaform --region eu-central-1 --query "DBInstances[0].{Status:DBInstanceStatus,Public:PubliclyAccessible,Encrypted:StorageEncrypted,Engine:EngineVersion}"
aws ecs describe-services --cluster metaform-gym-staging --services metaform-gym-staging --profile metaform --region eu-central-1 --query "services[0].{Desired:desiredCount,Running:runningCount,Pending:pendingCount,Rollouts:deployments[*].rolloutState,Events:events[0:10].message}"
aws logs tail /metaform-gym/staging/express --since 30m --profile metaform --region eu-central-1
aws logs tail /metaform-gym/staging/prediction --since 30m --profile metaform --region eu-central-1
```

Then retrieve the ALB DNS name from the stack output without recording account
identifiers and check:

- `GET http://<ALB_DNS>/api/v1/health` returns HTTP 200.
- `GET http://<ALB_DNS>/api/v1/health/database` confirms an actual database
  connection; the ALB health endpoint alone does not prove schema readiness.
- ECS reports the Express container running and the prediction container
  `HEALTHY`; prediction is non-essential and is not covered by ALB health.
- The target group has one healthy IP target after desired count becomes 1.
- A controlled authenticated prediction request produces a valid response and
  proves Node-to-FastAPI communication. Do not expose port 8001 for testing.
- No `ResourceInitializationError`, image-pull, secret-injection, migration,
  Prisma, database, or sidecar errors appear in ECS events or CloudWatch logs.

## Deployment-risk review

| Risk | Current control | Stop condition |
|---|---|---|
| Asset build or ECR publication failure | Three reproducible CDK assets; bootstrap repository and publisher role already exist | Any failed asset build/publish |
| RDS engine/class unavailable | PostgreSQL 18.2 / `db.t4g.micro` currently returns orderable options in Frankfurt | Catalog/CloudFormation rejects the combination |
| RDS connectivity failure | Isolated RDS, ECS-SG-only ingress, TLS-required encoded URL, same-VPC DNS | Migration cannot connect or database health is not healthy |
| Migration race or API-before-schema | Service defaults to 0; one explicit migration task; no startup migration | More than one migration task, nonzero exit, or unresolved failed migration |
| Secret injection failure | Deploy-time generation, JSON field selectors, scoped execution roles, HTTPS egress | ECS `ResourceInitializationError` or missing-field failure |
| Container startup failure | Locally built/smoked images, non-root users, public-IP HTTPS egress | Repeated task stops, pull errors, or circuit-breaker rollback |
| FastAPI unavailable but API appears healthy | Sidecar health plus explicit ECS inspection and controlled feature test | Sidecar not `HEALTHY` or prediction workflow fails |
| ALB reports healthy while database is unusable | Separate `/health/database` validation required | Database endpoint is not healthy |
| Unexpected public exposure | Only ALB TCP/80 is public; task public IP has no public ingress; RDS and FastAPI private | Any ingress to 3000, 8001, or 5432 from a CIDR |
| Circular dependency or stuck stack | CDK synth succeeds; SG cross-rules and resource references synthesize without a cycle | Stack remains in progress beyond normal RDS provisioning or reports dependency failure |
| Unexpected cost | Desired count 0 during provisioning; Budget alerts; zero NAT | Unexpected resource, alarm, or projected spend |
| Fixed-name collision | Names are explicit and staging-only | Existing non-stack resource has a planned name |

## Cost impact

No NAT Gateway is created. With the service held at desired count 0, the first
stack is expected to cost approximately **USD 46-54/month** while retained,
mostly from the ALB and its public IPv4 addresses, Single-AZ RDS plus 20 GiB
gp3, and three secrets. Activating one 0.5-vCPU/1-GiB task and its public IPv4
raises the expected always-on staging total to approximately **USD 71-79/month**
at low traffic/log volume. A migration task lasting ten minutes should cost
well under USD 0.01; it must not remain running. ECR storage, logs, LCUs, data
transfer, snapshots, and partial hours can add cost. No Free Tier credits are
assumed. Continue monitoring existing AWS Budget alerts. Pricing remains
usage-based; see AWS [Fargate pricing](https://aws.amazon.com/fargate/pricing/),
[ELB pricing](https://aws.amazon.com/elasticloadbalancing/pricing/),
[RDS PostgreSQL pricing](https://aws.amazon.com/rds/postgresql/pricing/), and
[VPC/public IPv4 pricing](https://aws.amazon.com/vpc/pricing/).

## Rollback and cleanup strategy

- First-deploy failure: allow CloudFormation rollback; do not repair resources
  manually. Inspect stack events and retained snapshots before retrying.
- Migration failure: keep desired count 0, preserve logs, diagnose the exact
  Prisma migration state, and fix forward. Never reset or expose RDS. Rerun only
  after confirming no other migration task is active.
- Service-activation failure: the ECS deployment circuit breaker and
  CloudFormation update rollback should return to the prior zero-task state.
  Confirm actual desired/running counts rather than assuming rollback succeeded.
- Bad but healthy application: redeploy the reviewed prior asset through CDK or
  set the parameter back to 0 through CDK. Do not edit ECS directly.
- If staging is abandoned, a future reviewed `cdk destroy` can remove the
  application stack, but it is **not approved or run by this review**. RDS uses
  snapshot retention, so inspect and deliberately manage the retained snapshot
  and its cost. Secrets and the two log groups use delete policies. The
  termination-protected `CDKToolkit` bootstrap stack and its asset repository
  are separate and must not be mutated as application cleanup.

## Stop conditions

Stop before or during the future sequence if identity/account/region differs;
`--trust` appears; review changes are uncommitted or unexplained; synth/tests or
secret scan fail; npm/Scout reveals a new fixable critical issue; CloudFormation
shows an unexpected resource or IAM broadening; asset publication fails; RDS is
not available; migration does not start exactly once or exit 0; database health
fails; ECS rolls back or cannot reach steady state; the sidecar is unhealthy;
the target is unhealthy; public ingress differs from this manifest; or Budget
alerts/projected cost are unacceptable.

## Known residual risks and classification

- The three deployable images retain the documented, upstream-unfixed Debian
  Perl findings. No new fixable critical image finding remains.
- Local CDK tooling retains the explicitly accepted high `brace-expansion`
  advisory until a compatible CDK release is available.
- The standard bootstrap CloudFormation execution role retains the explicitly
  accepted broad single-account deployment permission.
- The ALB is HTTP-only and public. This supports only a technical staging smoke;
  it is not staging acceptance-ready and is not production-ready.
- RDS is Single-AZ and deletion protection is disabled; this is an economical
  staging choice, not a production durability posture.
- Prediction is intentionally non-essential and Express waits only for its
  start, so explicit sidecar and feature validation is mandatory.
- Migration execution is deliberately operator-gated rather than automatically
  orchestrated. This prevents concurrency/startup races but requires the exact
  sequence and exit-code check above.

## Review verification

- Infrastructure TypeScript: passed.
- CDK assertions: 10/10 passed.
- `cdk synth`: passed; 81 informational unconfigured feature-flag notices.
- Local API/FastAPI rebuild and health smoke: passed.
- Local Node-to-FastAPI smoke: passed.
- Migration image build, non-root check, missing-secret failure, Prisma launch,
  and failure-exit propagation: passed.
- Migration image final local scan: 2 critical / 2 high, all documented
  upstream-unfixed Perl findings; fixable tool findings removed.
- `npm audit`: one accepted high local-CDK-tooling advisory.
- High-confidence secret/private-key scan: zero matches.
- `git diff --check`: passed.

The exact readiness decision is `READY_FOR_FIRST_STAGING_DEPLOY`, contingent on
following the desired-count-0, single-migration-task, desired-count-1 sequence.
