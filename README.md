# Maintainer Agent Kit

> Zero-backend GitHub Action and CLI toolkit for open-source maintainers.

[![npm](https://img.shields.io/npm/v/maintainer-agent-kit)](https://www.npmjs.com/package/maintainer-agent-kit)
[![Release](https://img.shields.io/github/v/release/pouryawJs/maintainer-agent-kit?label=release)](https://github.com/pouryawJs/maintainer-agent-kit/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-96%25-blue)](https://github.com/pouryawJs/maintainer-agent-kit)
[![GitHub Action](https://img.shields.io/badge/GitHub%20Action-supported-black?logo=githubactions)](./action.yml)

**Maintainer Agent Kit** helps open-source maintainers automate small but repetitive repository tasks without hosting a server, running a database, or using an AI API key.

The MVP focuses on two maintainer workflows:

* Rule-based GitHub issue triage
* Deterministic Markdown release notes generation

It can run as both:

* A **GitHub Action** for repository automation
* A **local CLI** for config validation, dry-runs, and release note generation

---

## Why this exists

Open-source maintainers often spend time on repetitive repository chores:

* Labeling incoming issues
* Separating bugs, docs, features, and beginner-friendly tasks
* Preparing release notes from merged pull requests
* Keeping repository workflows consistent

Maintainer Agent Kit provides a lightweight, config-first way to automate those tasks.

It is intentionally simple: no hosted service, no dashboard, no database, and no required AI provider.

---

## Features

* Validate `.maintainer-agent.yml` configuration files
* Match issue titles and bodies against label keyword rules
* Add labels to GitHub issues through GitHub Actions
* Run local dry-run issue triage from GitHub event JSON
* Generate Markdown release notes from merged pull request JSON
* Support `good first issue` style labeling rules
* Support dry-run mode before applying labels
* Keep MVP behavior rule-based, deterministic, and testable

---

## Installation

Install as a dev dependency:

```bash
npm install -D maintainer-agent-kit
```

Run directly with npx:

```bash
npx maintainer-agent-kit --help
```

After installation, you can use either binary:

```bash
maintainer-agent-kit --help
mak --help
```

---

## Quick Start: CLI

Create a config file:

```bash
npx maintainer-agent-kit init
```

Validate your config:

```bash
npx maintainer-agent-kit validate --config .maintainer-agent.yml
```

Run a local dry-run against an issue event fixture:

```bash
npx maintainer-agent-kit triage \
  --config examples/basic/.maintainer-agent.yml \
  --event fixtures/issue.bug.json
```

Generate release notes from a local merged pull request JSON file:

```bash
npx maintainer-agent-kit release-notes \
  --config examples/basic/.maintainer-agent.yml \
  --prs fixtures/merged-prs.json
```

Write release notes to a file:

```bash
npx maintainer-agent-kit release-notes \
  --config examples/basic/.maintainer-agent.yml \
  --prs fixtures/merged-prs.json \
  --out RELEASE_NOTES.md
```

---

## Quick Start: GitHub Action

Create a `.maintainer-agent.yml` file in your repository:

```yml
labels:
  bug:
    include:
      - bug
      - error
      - crash
      - broken
      - not working

  feature:
    include:
      - feature
      - request
      - support
      - add
      - implement

  docs:
    include:
      - docs
      - documentation
      - readme
      - typo

goodFirstIssue:
  enabled: true
  labels:
    - good first issue
  include:
    - typo
    - docs
    - readme
    - small
    - beginner
    - simple

releaseNotes:
  title: "Release Notes"
  groupByLabels:
    feature: "Features"
    bug: "Bug Fixes"
    docs: "Documentation"
    chore: "Maintenance"
  includePullRequestLinks: true
```

Then add this workflow:

```yml
name: Maintainer Agent Kit

on:
  issues:
    types: [opened, edited]

permissions:
  issues: write
  contents: read

jobs:
  triage:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pouryawJs/maintainer-agent-kit@v0.1.0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          config: .maintainer-agent.yml
          mode: triage
          dry-run: "false"
```

Set `dry-run: "true"` to log matched labels without applying them.

---

## Example Workflow

When a new issue is opened:

```txt
Bug: CLI crashes when config file is missing
```

Maintainer Agent Kit reads the issue title/body, checks the configured keywords, and applies matching labels such as:

```txt
bug
```

If the issue also contains words like `beginner`, `small`, `docs`, or `typo`, it can also apply:

```txt
good first issue
```

---

## Configuration

Maintainer Agent Kit uses a single YAML config file:

```txt
.maintainer-agent.yml
```

### Label rules

Each label can define a list of keywords:

```yml
labels:
  bug:
    include:
      - bug
      - error
      - crash
      - broken
```

If any keyword is found in the issue title or body, the label is matched.

### Good-first-issue rules

You can enable a separate rule group for beginner-friendly tasks:

```yml
goodFirstIssue:
  enabled: true
  labels:
    - good first issue
  include:
    - typo
    - docs
    - small
    - beginner
```

### Release notes config

Release notes can be grouped by labels:

```yml
releaseNotes:
  title: "Release Notes"
  groupByLabels:
    feature: "Features"
    bug: "Bug Fixes"
    docs: "Documentation"
    chore: "Maintenance"
  includePullRequestLinks: true
```

See [`examples/basic/.maintainer-agent.yml`](./examples/basic/.maintainer-agent.yml) for a complete example.

---

## CLI Commands

### Initialize config

```bash
npx maintainer-agent-kit init
```

This creates a starter `.maintainer-agent.yml` file.

### Validate config

Validate the default `.maintainer-agent.yml`:

```bash
npx maintainer-agent-kit validate
```

Validate an explicit config path:

```bash
npx maintainer-agent-kit validate --config examples/basic/.maintainer-agent.yml
```

Short alias after local installation:

```bash
mak validate -c examples/basic/.maintainer-agent.yml
```

### Triage issue event locally

Run a local dry-run triage against a GitHub issue event JSON file:

```bash
npx maintainer-agent-kit triage \
  --config examples/basic/.maintainer-agent.yml \
  --event fixtures/issue.bug.json
```

Short alias after local installation:

```bash
mak triage -c examples/basic/.maintainer-agent.yml -e fixtures/issue.bug.json
```

This command prints the labels that would be added and the rules that matched.

It does not call the GitHub API.

### Generate release notes

Print Markdown release notes to stdout:

```bash
npx maintainer-agent-kit release-notes \
  --config examples/basic/.maintainer-agent.yml \
  --prs fixtures/merged-prs.json
```

Write Markdown release notes to a file:

```bash
npx maintainer-agent-kit release-notes \
  --config examples/basic/.maintainer-agent.yml \
  --prs fixtures/merged-prs.json \
  --out RELEASE_NOTES.md
```

---

## Release Notes Behavior

Release notes generation is deterministic:

* Pull requests are sorted by number
* Configured release note groups are evaluated in config order
* A pull request appears in the first matching group only
* Unmatched pull requests go under `Other Changes`
* Missing URLs fall back to plain `#number` references
* Missing authors are omitted

Example output:

```md
# Release Notes

## Features

- Add GitHub Action support (#12) by @contributor

## Bug Fixes

- Fix config validation error message (#15) by @contributor

## Documentation

- Improve README usage examples (#18)
```

---

## How Matching Works

Issue triage is intentionally simple in the MVP:

* Issue title and body are combined
* Text and keywords are lowercased
* Whitespace is normalized
* Matching uses substring checks
* Multiple labels can match one issue
* Good-first-issue labels are added only when enabled and configured keywords match
* Duplicate labels are removed while preserving deterministic order

This makes the behavior predictable, easy to test, and safe to run in dry-run mode.

---

## GitHub Action Inputs

| Input     | Required | Default                 | Description                            |
| --------- | -------: | ----------------------- | -------------------------------------- |
| `config`  |       No | `.maintainer-agent.yml` | Path to the config file                |
| `mode`    |       No | `triage`                | Automation mode. MVP supports `triage` |
| `dry-run` |       No | `false`                 | Log labels without applying them       |

---

## Permissions

For issue triage, the workflow needs:

```yml
permissions:
  issues: write
  contents: read
```

`issues: write` is required to apply labels.

`contents: read` is required to read the config file from the repository.

---

## Project Structure

```txt
maintainer-agent-kit/
├── .github/
│   └── workflows/
├── dist/
│   ├── action.js
│   └── index.js
├── examples/
│   ├── basic/
│   └── github-action/
├── fixtures/
├── src/
│   ├── commands/
│   ├── core/
│   ├── github/
│   ├── schemas/
│   ├── utils/
│   ├── action.ts
│   └── index.ts
├── tests/
├── action.yml
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

---

## Development

Clone the repository:

```bash
git clone https://github.com/pouryawJs/maintainer-agent-kit.git
cd maintainer-agent-kit
```

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Build:

```bash
npm run build
```

Format files:

```bash
npm run format
```

---

## Versioned Usage

Use the latest MVP release as a GitHub Action:

```yml
uses: pouryawJs/maintainer-agent-kit@v0.1.0
```

Use the npm package:

```bash
npm install -D maintainer-agent-kit
```

Or run directly:

```bash
npx maintainer-agent-kit --help
```

---

## Roadmap

Planned improvements:

* Add more real-world config examples
* Improve duplicate-label handling against existing issue labels
* Add GitHub release integration for generated release notes
* Add config schema documentation
* Add Marketplace-ready GitHub Action metadata
* Add more tests for GitHub Action behavior
* Add demo screenshots or GIFs
* Add optional AI-assisted triage as a future adapter

Not planned for the MVP:

* Hosted services
* Dashboard UI
* Database storage
* GitHub App mode
* PR review automation

---

## Contributing

Contributions are welcome.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for local setup, coding standards, and test commands.

Good first areas to contribute:

* More config examples
* Documentation improvements
* Additional tests
* Release notes formatting improvements
* GitHub Action usage examples

---

## Security

This project does not require a hosted backend or external database.

For GitHub Action usage, it relies on the repository-provided `GITHUB_TOKEN` and only needs the permissions required for the selected workflow.

If you find a security issue, please open a private report through GitHub Security Advisories if enabled, or contact the maintainer directly.

---

## License

MIT. See [`LICENSE`](./LICENSE).
