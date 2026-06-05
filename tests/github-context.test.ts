import { describe, expect, it } from 'vitest';
import { getIssueContext } from '../src/github/context';

describe('GitHub context helpers', () => {
  it('extracts owner, repo, and issue number', () => {
    expect(
      getIssueContext({
        githubContext: {
          repo: {
            owner: 'example',
            repo: 'project'
          }
        },
        payload: {
          issue: {
            number: 42
          }
        }
      })
    ).toEqual({
      owner: 'example',
      repo: 'project',
      issueNumber: 42
    });
  });

  it('prefers the passed issue number', () => {
    expect(
      getIssueContext({
        githubContext: {
          repo: {
            owner: 'example',
            repo: 'project'
          }
        },
        payload: {
          issue: {
            number: 42
          }
        },
        issueNumber: 108
      }).issueNumber
    ).toBe(108);
  });

  it('throws a friendly error when owner or repo is missing', () => {
    expect(() =>
      getIssueContext({
        githubContext: {},
        payload: {
          issue: {
            number: 42
          }
        }
      })
    ).toThrow('Unable to determine GitHub repository owner and name.');
  });

  it('throws a friendly error when issue number is missing', () => {
    expect(() =>
      getIssueContext({
        githubContext: {
          repo: {
            owner: 'example',
            repo: 'project'
          }
        },
        payload: {}
      })
    ).toThrow('Unable to determine GitHub issue number.');
  });
});
