import { describe, expect, it } from 'vitest';
import { matchLabels } from '../src/core/matcher';
import { triageIssue } from '../src/core/triage';
import type { MaintainerAgentConfig } from '../src/core/types';

const config: MaintainerAgentConfig = {
  labels: {
    bug: {
      include: ['bug', 'crash', 'error']
    },
    docs: {
      include: ['docs', 'documentation', 'readme']
    },
    question: {
      include: ['question', 'help']
    }
  },
  goodFirstIssue: {
    enabled: true,
    labels: ['good first issue'],
    include: ['docs', 'simple']
  }
};

describe('matchLabels triage behavior', () => {
  it('adds the bug label for a bug issue', () => {
    const result = matchLabels(
      {
        title: 'Bug: app crashes',
        body: 'An error appears after login.'
      },
      config
    );

    expect(result.labelsToAdd).toEqual(['bug']);
    expect(result.matchedRules).toContainEqual({
      label: 'bug',
      matchedKeywords: ['bug', 'crash', 'error']
    });
  });

  it('adds the docs label for a docs issue', () => {
    const result = matchLabels(
      {
        title: 'Docs typo',
        body: 'The README has outdated documentation.'
      },
      config
    );

    expect(result.labelsToAdd).toEqual(['docs', 'good first issue']);
    expect(result.matchedRules).toContainEqual({
      label: 'docs',
      matchedKeywords: ['docs', 'documentation', 'readme']
    });
  });

  it('adds multiple labels for issues matching multiple rules', () => {
    const result = matchLabels(
      {
        title: 'Bug in docs',
        body: 'The README crashes the parser.'
      },
      config
    );

    expect(result.labelsToAdd).toEqual(['bug', 'docs', 'good first issue']);
  });

  it('returns empty labels and matched rules when nothing matches', () => {
    expect(
      matchLabels(
        {
          title: 'Refactor internal module',
          body: 'Maintenance cleanup.'
        },
        config
      )
    ).toEqual({
      labelsToAdd: [],
      matchedRules: []
    });
  });

  it('applies good-first-issue labels when enabled', () => {
    const result = matchLabels(
      {
        title: 'Simple docs update',
        body: 'Improve getting started docs.'
      },
      config
    );

    expect(result.labelsToAdd).toEqual(['docs', 'good first issue']);
    expect(result.matchedRules).toContainEqual({
      label: 'goodFirstIssue',
      matchedKeywords: ['docs', 'simple']
    });
  });

  it('does not apply good-first-issue labels when disabled', () => {
    const disabledConfig: MaintainerAgentConfig = {
      ...config,
      goodFirstIssue: {
        enabled: false,
        labels: ['good first issue'],
        include: ['docs', 'simple']
      }
    };

    const result = matchLabels(
      {
        title: 'Simple docs update',
        body: 'Improve getting started docs.'
      },
      disabledConfig
    );

    expect(result.labelsToAdd).toEqual(['docs']);
    expect(result.matchedRules.map((rule) => rule.label)).not.toContain('goodFirstIssue');
  });

  it('deduplicates labels while preserving deterministic order', () => {
    const duplicateConfig: MaintainerAgentConfig = {
      labels: {
        bug: {
          include: ['bug']
        }
      },
      goodFirstIssue: {
        enabled: true,
        labels: ['bug', 'good first issue'],
        include: ['simple']
      }
    };

    const result = matchLabels(
      {
        title: 'Simple bug',
        body: null
      },
      duplicateConfig
    );

    expect(result.labelsToAdd).toEqual(['bug', 'good first issue']);
  });

  it('triageIssue returns the same result shape as matchLabels', async () => {
    const issue = {
      title: 'Bug in docs',
      body: 'The README crashes the parser.'
    };

    await expect(triageIssue(issue, config)).resolves.toEqual(matchLabels(issue, config));
  });
});
