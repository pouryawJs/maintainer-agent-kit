import { describe, expect, it } from 'vitest';
import { generateReleaseNotes } from '../src/core/release-notes';
import type { MaintainerAgentConfig, PullRequestLike } from '../src/core/types';

const config: MaintainerAgentConfig = {
  labels: {
    feature: { include: ['feature'] }
  },
  releaseNotes: {
    title: 'Project Changes',
    groupByLabels: {
      feature: 'Features',
      bug: 'Bug Fixes',
      docs: 'Documentation'
    },
    includePullRequestLinks: true
  }
};

const pullRequests: PullRequestLike[] = [
  {
    number: 30,
    title: 'Refactor command helpers',
    url: 'https://github.com/example/project/pull/30',
    labels: ['internal'],
    author: 'contributor'
  },
  {
    number: 7,
    title: 'Fix config crash',
    url: 'https://github.com/example/project/pull/7',
    labels: ['bug'],
    author: 'maintainer'
  },
  {
    number: 42,
    title: 'Add Docker support',
    url: 'https://github.com/example/project/pull/42',
    labels: ['feature'],
    author: 'octocat'
  },
  {
    number: 18,
    title: 'Document config',
    labels: ['docs']
  }
];

describe('generateReleaseNotes', () => {
  it('groups PRs by configured labels', () => {
    const markdown = generateReleaseNotes({ pullRequests, config });

    expect(markdown).toContain('## Features\n- Add Docker support');
    expect(markdown).toContain('## Bug Fixes\n- Fix config crash');
    expect(markdown).toContain('## Documentation\n- Document config');
  });

  it('places unknown labels under Other Changes', () => {
    expect(generateReleaseNotes({ pullRequests, config })).toContain(
      '## Other Changes\n- Refactor command helpers'
    );
  });

  it('sorts output deterministically by PR number', () => {
    const markdown = generateReleaseNotes({
      pullRequests,
      config: {
        labels: {},
        releaseNotes: {
          title: 'Project Changes',
          groupByLabels: {},
          includePullRequestLinks: true
        }
      }
    });

    expect(markdown.indexOf('#7')).toBeLessThan(markdown.indexOf('#18'));
    expect(markdown.indexOf('#18')).toBeLessThan(markdown.indexOf('#30'));
    expect(markdown.indexOf('#30')).toBeLessThan(markdown.indexOf('#42'));
  });

  it('includes PR links when enabled and URL exists', () => {
    expect(generateReleaseNotes({ pullRequests, config })).toContain(
      '- Add Docker support ([#42](https://github.com/example/project/pull/42)) by @octocat'
    );
  });

  it('falls back to plain PR numbers when URL is missing', () => {
    expect(generateReleaseNotes({ pullRequests, config })).toContain('- Document config (#18)');
  });

  it('omits author text when author is missing', () => {
    const markdown = generateReleaseNotes({ pullRequests, config });

    expect(markdown).toContain('- Document config (#18)');
    expect(markdown).not.toContain('- Document config (#18) by @');
  });

  it('disables Markdown PR links when includePullRequestLinks is false', () => {
    const markdown = generateReleaseNotes({
      pullRequests,
      config: {
        ...config,
        releaseNotes: {
          ...config.releaseNotes!,
          includePullRequestLinks: false
        }
      }
    });

    expect(markdown).toContain('- Add Docker support (#42) by @octocat');
    expect(markdown).not.toContain('[#42]');
  });

  it('uses defaults when releaseNotes config is missing', () => {
    const markdown = generateReleaseNotes({
      pullRequests: [pullRequests[0]],
      config: {
        labels: {}
      }
    });

    expect(markdown).toBe(
      [
        '# Release Notes',
        '',
        '## Other Changes',
        '- Refactor command helpers ([#30](https://github.com/example/project/pull/30)) by @contributor',
        ''
      ].join('\n')
    );
  });

  it('outputs a valid document when there are no pull requests', () => {
    expect(generateReleaseNotes({ pullRequests: [], config })).toBe(
      '# Project Changes\n\nNo pull requests found.\n'
    );
  });
});
