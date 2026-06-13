# PR Risk Radar

[![CI](https://github.com/domhuang/pr-risk-radar/actions/workflows/ci.yml/badge.svg)](https://github.com/domhuang/pr-risk-radar/actions/workflows/ci.yml)
[![PR Risk Radar](https://github.com/domhuang/pr-risk-radar/actions/workflows/pr-risk-radar.yml/badge.svg)](https://github.com/domhuang/pr-risk-radar/actions/workflows/pr-risk-radar.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)

PR Risk Radar is a small GitHub Action and CLI that helps maintainers spot risky pull requests before review time disappears.

It scans changed files and highlights review focus areas such as auth, payments, database migrations, CI/deployment changes, dependency updates, large diffs, and source changes without tests.

## Why this exists

Open-source maintainers often have to triage pull requests quickly. A small change in an auth module can need more attention than a large docs update. PR Risk Radar gives maintainers a first-pass risk report that is easy to read, easy to tune, and cheap to run.

## Example report

```md
## PR Risk Radar

**Overall risk:** HIGH

Changed files: 3 | Additions: 420 | Deletions: 50

### Review Focus

- **HIGH** Auth or security-sensitive code changed
  - Why it matters: Ask for a focused review from someone familiar with auth, access control, or secrets handling.
  - Files: `src/auth/session.ts`
- **MEDIUM** Source changed without tests
  - Why it matters: Ask whether existing tests cover this behavior or request a small regression test.
  - Files: `src/auth/session.ts`, `src/user/profile.ts`
```

## Use as a GitHub Action

Create `.github/workflows/pr-risk-radar.yml`:

```yaml
name: PR Risk Radar

on:
  pull_request:

permissions:
  contents: read
  pull-requests: read
  issues: write

jobs:
  radar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: domhuang/pr-risk-radar@v0.1.2
        with:
          comment: "true"
          fail-on: none
```

## Use locally

```bash
npx pr-risk-radar --base origin/main --head HEAD
npx pr-risk-radar --base main --head feature-branch --format json --output report.json
```

## Risk signals

- Auth, sessions, permissions, secrets, tokens, or crypto paths
- Billing, checkout, subscription, or payment paths
- Database schema, migration, or ORM paths
- CI, Docker, deployment, Terraform, Kubernetes, or workflow paths
- Dependency lockfile changes
- Large file changes
- Source code changes without tests
- Broad source changes without docs

## Roadmap

- Config file for project-specific path rules
- Maintainer-owned risk labels
- Existing comment updates instead of duplicate PR comments
- Optional SARIF output
- Better monorepo package detection
- AI-assisted risk explanations for maintainers who opt in

## Contributing

Issues and pull requests are welcome. Keep rules explainable and avoid noisy heuristics; the goal is to help reviewers focus, not to block contributors.

## License

MIT
