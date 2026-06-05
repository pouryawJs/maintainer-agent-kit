import { describe, expect, it } from 'vitest';
import { getIssueFromEventPayload, readGitHubEventPayload } from '../src/github/event';

describe('GitHub event helpers', () => {
  it('returns IssueLike for a valid issue payload', async () => {
    const payload = await readGitHubEventPayload('fixtures/issue.bug.json');

    expect(getIssueFromEventPayload(payload)).toEqual({
      number: 108,
      title: 'App crashes when config file is missing',
      body: 'The CLI exits unexpectedly instead of showing a friendly validation error.',
      labels: undefined
    });
  });

  it('returns null for unsupported payloads', async () => {
    const payload = await readGitHubEventPayload('fixtures/events/no-issue.json');

    expect(getIssueFromEventPayload(payload)).toBeNull();
  });

  it('converts issue label objects to label names', () => {
    expect(
      getIssueFromEventPayload({
        issue: {
          number: 10,
          title: 'Docs update',
          body: null,
          labels: [{ name: 'docs' }, { name: 'good first issue' }]
        }
      })
    ).toEqual({
      number: 10,
      title: 'Docs update',
      body: null,
      labels: ['docs', 'good first issue']
    });
  });
});
