# maintainer-agent-kit

Zero-backend GitHub Action and CLI toolkit for open-source maintainers.

`maintainer-agent-kit` helps maintainers automate lightweight repository chores without running a server. The MVP supports rule-based GitHub issue triage and deterministic release notes generation from local JSON files.

## Features

- Validate `.maintainer-agent.yml` configuration files.
- Match issue titles and bodies against label keyword rules.
- Run local dry-run issue triage from GitHub issue event JSON.
- Generate Markdown release notes from local merged pull request JSON.
- Run as a GitHub Action for issue triage.
- Support dry-run mode before applying labels.
- Keep all MVP behavior rule-based, deterministic, and testable.

## Requirements

- Node.js 20 or newer
- npm

## Installation

Install dependencies for local development:

```sh
npm install
```

Build the package:

```sh
npm run build
```

After building, the CLI entrypoint is available at `dist/index.js`. Published installs expose both `mak` and `maintainer-agent-kit` binary aliases.

## Configuration

Create `.maintainer-agent.yml` in your repository:

```yaml
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

See [examples/basic/.maintainer-agent.yml](examples/basic/.maintainer-agent.yml) for a complete example.

## CLI Usage

### Validate Config

Validate the default `.maintainer-agent.yml`:

```sh
mak validate
```

Validate an explicit config path:

```sh
mak validate --config examples/basic/.maintainer-agent.yml
mak validate -c examples/basic/.maintainer-agent.yml
```

### Triage Issue Event

Run a local dry-run triage against a GitHub issue event JSON file:

```sh
mak triage --config examples/basic/.maintainer-agent.yml --event fixtures/issue.bug.json
mak triage -c examples/basic/.maintainer-agent.yml -e fixtures/issue.bug.json
```

This command prints labels that would be added and the rules that matched. It does not call the GitHub API.

### Generate Release Notes

Print Markdown release notes to stdout:

```sh
mak release-notes --config examples/basic/.maintainer-agent.yml --prs fixtures/merged-prs.json
mak release-notes -c examples/basic/.maintainer-agent.yml -p fixtures/merged-prs.json
```

Write Markdown release notes to a file:

```sh
mak release-notes --config examples/basic/.maintainer-agent.yml --prs fixtures/merged-prs.json --out RELEASE_NOTES.md
```

## GitHub Action Usage

Add a workflow like this:

```yaml
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
          dry-run: 'false'
```

Set `dry-run: 'true'` to log matched labels without applying them.

See [examples/github-action/workflow.yml](examples/github-action/workflow.yml).

## How Matching Works

Issue triage is intentionally simple in the MVP:

- Issue title and body are combined.
- Text and keywords are lowercased, whitespace-normalized, and trimmed.
- Matching uses substring checks.
- Multiple labels can match one issue.
- Good-first-issue labels are added only when enabled and configured keywords match.
- Duplicate labels are removed while preserving deterministic order.

## Release Notes Behavior

Release notes generation is deterministic:

- Pull requests are sorted by number.
- Configured release note groups are evaluated in config order.
- A pull request appears in the first matching group only.
- Unmatched pull requests go under `Other Changes`.
- Missing URLs fall back to plain `#number` references.
- Missing authors are omitted.

## Development

Run tests:

```sh
npm test
```

Run lint:

```sh
npm run lint
```

Build:

```sh
npm run build
```

Format files:

```sh
npm run format
```

## Roadmap

- Documentation, CI, and release polish.
- GitHub release preparation.
- Broader GitHub Action coverage.
- Optional release notes integration with GitHub releases.
- More robust duplicate-label handling against existing issue labels.
- Additional config examples.

Not planned for the MVP:

- AI classification
- External services
- Dashboard UI
- GitHub App mode
- PR review automation

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, coding standards, and test commands.

## License

MIT. See [LICENSE](LICENSE).
