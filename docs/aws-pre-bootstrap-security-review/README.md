# AWS Pre-Bootstrap Security Review

**Review date:** 2026-08-10  
**Gate:** first AWS staging bootstrap only  
**Decision:** `GO_WITH_ACCEPTED_RESIDUAL_RISK`

## Scope and evidence

This review covers the two final runtime images, the locally synthesized staging
stack, CDK/bootstrap permissions, the authenticated read-only AWS identity,
and an updated Frankfurt cost estimate. It does not approve deployment or call
the environment production-ready. No bootstrap, deploy, image push, or other
AWS-mutating action was performed.

Evidence was collected from the current worktree, final local images, Docker
Scout 1.23.1, `npm audit`, `cdk synth`, the npm registry, official Docker image
metadata, AWS documentation/pricing data, the Debian Security Tracker, and the
GitHub advisory database.

## Deterministic decision

The repository and runtime controls are suitable for a small, account-local
staging bootstrap with explicitly accepted residual risk. The project owner
has accepted the three named security risks documented below and the economical
staging cost model. The owner also manually compared the read-only STS result
with the approved target account out of band; the account number is deliberately
not recorded here.

The final decision is `GO_WITH_ACCEPTED_RESIDUAL_RISK`. There is no known
critical **fixable** runtime vulnerability blocking this limited first staging
bootstrap. This decision does not approve application deployment and does not
classify the environment as production-ready.

## Runtime images

| Image | Final size | User | Local Scout critical/high | Result |
|---|---:|---|---:|---|
| `metaform-gym-api:staging` | 112,921,365 bytes (113 MB) | `node`, UID 1000 | 2 / 2 | Built and smoke-tested |
| `metaform-gym-prediction:staging` | 200,057,565 bytes (200 MB) | `metaform`, UID 100 | 2 / 2 | Built and smoke-tested |

The API production install now omits development, optional, and peer packages.
This removed an unused Prisma CLI/Studio/React/TypeScript chain, reduced the API
image by about 73 MB, and left the build/migration stage unchanged. Runtime
checks confirmed that npm/npx, compilers, Git, Prisma CLI, TypeScript, React,
and Prisma Studio are absent. The Python runtime similarly has no pip, compiler,
Git, pytest, mypy, Ruff, or Jupyter executable.

Only normal base/runtime environment keys are present in image configuration.
No application secret, `.env` file, AWS credential, private key, or credential
file was found in image checks. The local Compose smoke secrets were injected
at container creation and are not image layers or configuration defaults.

## Debian Perl findings and reachability

Both images retain the Debian `perl-base` package:

- API: `perl 5.36.0-7+deb12u3` on Bookworm.
- Prediction: `perl 5.40.1-6` on Trixie.

Docker Scout reports the same four upstream-unfixed findings in each image:

| CVE | Severity | Relevant code | Reachability in these services | Disposition |
|---|---|---|---|---|
| CVE-2026-13221 | Critical | Perl regular-expression handling | No Perl process, hook, or subprocess path; Debian's Bookworm attribution also conflicts with its note about the affected upstream introduction | Unfixed residual |
| CVE-2026-12087 | Critical | `Socket` source-membership packing | `Socket` is installed, but neither application invokes Perl or passes HTTP/application data to this API | Unfixed residual |
| CVE-2026-48959 | High | `IO::Uncompress::Unzip` CPU exhaustion | Affected module is not installed; no Perl execution path | Unfixed and unreachable |
| CVE-2026-48962 | High | `IO::Compress`/`File::GlobMapper` glob handling | Affected modules are not installed; no Perl execution path | Unfixed and unreachable |

The application source contains no Node child-process execution and no Python
subprocess or shell execution path. The final commands are Node and Uvicorn;
neither calls Perl. Simulated removal in both images warned that `perl-base` is
an Essential/required Debian package. Manual deletion would corrupt package
integrity without providing a maintainable security boundary, so Perl remains.

Current realistic official Node 22 slim Bookworm/Trixie and Python 3.12 slim
Bookworm/Trixie alternatives were pulled/inspected. The realistic Debian
alternatives retained the same Perl findings, so switching did not improve the
security result. Alpine/distroless was not selected because it would add musl,
Prisma, and scientific-Python compatibility/maintenance risk without verified
benefit. See the official [Node image](https://hub.docker.com/_/node),
[Python image](https://hub.docker.com/_/python), and Debian tracker entries for
[CVE-2026-13221](https://security-tracker.debian.org/tracker/CVE-2026-13221),
[CVE-2026-12087](https://security-tracker.debian.org/tracker/CVE-2026-12087),
[CVE-2026-48959](https://security-tracker.debian.org/tracker/CVE-2026-48959),
and [CVE-2026-48962](https://security-tracker.debian.org/tracker/CVE-2026-48962).

## Runtime validation

- Express health: HTTP success, `API is running`.
- FastAPI health: HTTP success, service `body-weight-prediction`,
  `RESEARCH_PREVIEW`.
- Node to FastAPI: HTTP 200 with a validated `ABSTAINED` / `RECENT_TREND`
  research-preview response.
- Shutdown: both containers handled SIGTERM, exited 0, and were not OOM-killed;
  Express logged shutdown start/completion and Uvicorn completed application
  shutdown.
- Idle samples: API 49.5-49.6 MiB; prediction 120.9-121.0 MiB; combined about
  171 MiB. This supports the 0.5 vCPU/1 GiB low-volume staging hypothesis, but
  is not a load-test or a production capacity guarantee.

## CDK advisory

On the review date, the npm registry still reports these latest compatible
versions: `aws-cdk-lib 2.263.0`, CDK CLI `2.1135.1`, and `constructs 10.8.1`.
`npm audit` reports one high advisory: `brace-expansion 5.0.8`, bundled under
`aws-cdk-lib` through minimatch, affected below 5.0.9 by
[GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895).
No newer compatible CDK library release contains the patched version, so no
update or lockfile change was made. No override or suppression was added.

This dependency is local infrastructure tooling used during synth/deploy. It
is not copied into either application image. Exploitation would require
attacker-controlled glob/brace input reaching that local toolchain; the CDK
application and its inputs are repository-controlled. Temporary staging use is
reasonable only as an explicitly accepted residual risk.

## Synthesized IAM and network review

- The application task role has no permissions.
- The execution role has the standard ECS execution managed policy plus scoped
  ECR repository pull, two log-group stream/write permissions, and read access
  to the exact RDS/JWT secrets.
- `ecr:GetAuthorizationToken` uses `Resource: "*"`; ECR does not support
  repository scoping for that action. No runtime role has `Action: "*"` or
  AdministratorAccess.
- The API receives traffic only from the ALB security group on port 3000.
  FastAPI listens inside the task and is not publicly exposed.
- RDS is private, encrypted, and accepts PostgreSQL only from the ECS task
  security group.
- Region is explicitly `eu-central-1`; synthesized NAT Gateway count is zero.
  The 512 CPU/1024 MiB task uses a public IP for direct outbound access.
- The current ALB listener is HTTP-only. That does not prevent creation of the
  bootstrap support stack, but it blocks treating a later application
  deployment as staging-acceptance-ready until HTTPS/ACM is added.

The locally synthesized application stack contains a VPC with public and
isolated subnets, Internet Gateway/routes, ECS cluster/task/service, an ALB,
private encrypted RDS PostgreSQL, three Secrets Manager secrets, two log groups,
and scoped runtime roles. The architecture remained unchanged after the Docker
asset change.

## Bootstrap security review

The standard modern bootstrap template creates an S3 asset bucket, ECR asset
repository, SSM bootstrap-version parameter, bucket/repository policies, and
five roles: CloudFormation execution, deployment action, file publishing,
image publishing, and lookup. The default qualifier remains `hnb659fds`.
AWS documents these resources in the
[bootstrapping guide](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping-env.html)
and [bootstrap customization reference](https://docs.aws.amazon.com/cdk/v2/guide/ref-cli-cmd-bootstrap.html).

No cross-account trusted account is needed. Do not pass `--trust`. The account
performing bootstrap remains trusted locally. The standard bootstrap
CloudFormation execution role defaults to AdministratorAccess; this is a
deployment role, not an application runtime role, and its breadth is explicitly
accepted for this single-account staging bootstrap only. Bootstrap termination protection is
recommended. A customer-managed bootstrap KMS key is not needed for this
single-account staging case.

Read-only STS resolved a 12-digit account and IAM user `metaform-admin`; root
credentials were not in use. A session token was present, consistent with the
documented temporary MFA profile, but STS identity alone does not prove MFA.
The profile has no default region; every future command must retain the explicit
`eu-central-1` target. The project owner manually verified the resolved account
against the approved staging target out of band. The account number is
deliberately not recorded here.

### Proposed next command — DO NOT RUN

```powershell
npx --prefix infrastructure cdk bootstrap aws://<ACCOUNT_ID>/eu-central-1 --profile metaform --termination-protection --no-bootstrap-customer-key
```

Before running it, substitute the already verified account ID, re-run read-only
STS identity, verify the temporary MFA session is current, and confirm that no
`--trust` argument is present.

## Frankfurt cost and scheduled staging

The estimate uses current eu-central-1 public price-list rates, assumes a
730-hour month, low traffic/log volume, no Free Tier credits, and no NAT
Gateway. It excludes later Amplify, Route 53, domain, and certificate work.

| Mode | Estimated monthly cost |
|---|---:|
| Always-on synthesized staging | approximately USD 71-79 |
| ECS scheduled about 12 hours/day, infrastructure retained | approximately USD 59-67 |
| ECS plus bounded RDS stop windows where practical | approximately USD 52-60 |

Largest/fixed drivers are the ALB (about USD 19.71 before LCUs), its two public
IPv4 addresses (about USD 7.30), and RDS instance/storage (about USD 16.61).
Always-on Fargate 0.5 vCPU/1 GiB plus its public IPv4 is about USD 24.4; at
12 hours/day it is about USD 12.2. Three secrets are about USD 1.20. Logs, ECR,
LCUs, and transfer create the range.

Setting ECS desired count to zero outside test windows saves task compute and
its task public IPv4, while ALB, ALB IPv4, RDS storage, and secrets remain.
RDS can be stopped only for bounded periods and automatically restarts after
seven days, so it is not a permanent scheduler substitute. See AWS
[Fargate pricing](https://aws.amazon.com/fargate/pricing/),
[Elastic Load Balancing pricing](https://aws.amazon.com/elasticloadbalancing/pricing/),
[RDS pricing](https://aws.amazon.com/rds/postgresql/pricing/), and
[VPC public IPv4 pricing](https://aws.amazon.com/vpc/pricing/).

The owner approves the economical scheduled-staging operating model, understands
that charges remain usage-based, and requires continued monitoring through the
existing AWS Budget alerts. This review did not alter budgets or billing.

## Gate criteria

| Criterion | Status |
|---|---|
| No committed secrets / image credentials | Pass |
| No critical fixable runtime vulnerability | Pass |
| Unfixed runtime findings understood and reachability assessed | Pass |
| Residual runtime/tooling/bootstrap risks explicitly owner-accepted | Pass |
| CDK advisory limited to local tooling | Pass |
| Runtime IAM least-privilege enough for staging | Pass |
| Zero NAT; private/encrypted RDS; private FastAPI | Pass |
| Both containers non-root; smoke and shutdown pass | Pass |
| CDK assertions and synth pass | Pass |
| Account/profile/region fully verified against approved target | Pass |
| Economical staging mode and usage-based cost accepted | Pass |
| Bootstrap trust account-local only | Pass by proposed command |

## Verification results

- API hardening tests: 7/7 passed.
- Prediction serving tests: 18/18 passed; one upstream Starlette TestClient
  deprecation warning.
- Infrastructure TypeScript: passed.
- CDK assertions: 9/9 passed.
- `cdk synth`: passed (81 informational unconfigured feature-flag notices).
- Refreshed Express and FastAPI health plus Node-to-FastAPI smoke: passed.
- Refreshed local Scout results: 2 critical and 2 high per image, unchanged,
  all in upstream-unfixed `perl-base`; no new fixable critical blocker.
- Refreshed `npm audit`: one accepted high local-tooling advisory, unchanged.
- Refreshed STS: IAM user `metaform-admin`, not root; approved account matched
  out of band and account number not recorded.
- Repository high-confidence credential/private-key scan: zero matches.
- The only tracked environment-style files are three `.env.example` templates.
- `git diff --check`: passed.

## Explicitly accepted residual staging risks

1. Four upstream-unfixed Debian Perl scanner findings per image, with the
   documented absent/unreachable application paths and no safe upstream fix.
2. One high `brace-expansion` advisory in local CDK tooling, with no compatible
   patched CDK release on the review date; upgrade is required when a compatible
   patched CDK release becomes available.
3. The broad standard bootstrap CloudFormation execution role in the target
   account for this single-account staging bootstrap only, while application
   runtime roles remain scoped.

No cross-account trust is accepted or approved. The HTTP-only ALB remains a
later application-deployment limitation; this bootstrap approval creates only
CDK support resources and is not an application deployment approval.

## Conditions that invalidate approval

This `GO_WITH_ACCEPTED_RESIDUAL_RISK` is invalid if the account, profile,
region, qualifier, trust flags, bootstrap template, Dockerfiles/base digests,
lockfiles, synthesized IAM/network resources, advisory status, or cost model
changes; if a fix becomes available and is not evaluated; if secrets are found;
if smoke/tests/synth fail; or if the task/public exposure model changes. Re-run
this gate immediately before the first bootstrap.

## Exact next stage

Immediately before acting, refresh read-only identity and confirm the proposed
command is unchanged. Then execute only the proposed account-local bootstrap
command. Stop again after bootstrap to inspect the created support stack before
any application deployment or image push.
