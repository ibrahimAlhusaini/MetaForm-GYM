# MetaForm GYM staging CDK workspace

This standalone AWS CDK v2 TypeScript package models staging only. It defaults
to `eu-central-1`, performs no AWS lookups, and must currently be used only for
local type checks, assertions, and synthesis.

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd test
npm.cmd run synth
```

Do not run `cdk bootstrap` or `cdk deploy` during this preparation stage. See
`docs/aws-containerization-cdk/README.md` for the architecture, security model,
and explicitly gated future deployment sequence.
