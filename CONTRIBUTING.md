# Contributing

Thanks for helping improve `maintainer-agent-kit`.

## Local Setup

Install dependencies:

```sh
npm install
```

Build the project:

```sh
npm run build
```

Run tests:

```sh
npm test
```

Run lint:

```sh
npm run lint
```

Format files:

```sh
npm run format
```

## Coding Standards

- Keep changes scoped and easy to review.
- Prefer pure core functions for business logic.
- Keep CLI and GitHub Action files as thin adapters around core APIs.
- Use friendly user-facing errors; do not print raw stack traces for expected failures.
- Add focused tests for new behavior.
- Avoid implementing unrelated features in the same change.

## MVP Boundaries

The MVP is rule-based and zero-backend. Please avoid adding:

- AI or semantic classification
- External services
- Dashboard UI
- GitHub App mode
- PR review automation
- GitHub release publishing

Those ideas can be discussed as future work, but they should not land casually in small maintenance PRs.

## Pull Request Checklist

- Tests cover the behavior changed.
- `npm test` passes.
- `npm run lint` passes.
- `npm run build` passes.
- Documentation or examples are updated when user-facing behavior changes.
