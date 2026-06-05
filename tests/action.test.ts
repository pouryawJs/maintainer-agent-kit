import { describe, expect, it, vi } from 'vitest';
import { runAction } from '../src/action';
import { addLabelsToIssue } from '../src/github/labels';

function createGetInput(inputs: Record<string, string>): (name: string) => string {
  return (name: string) => inputs[name] ?? '';
}

describe('GitHub Action runtime', () => {
  it('does not call the labels API in dry-run mode', async () => {
    const addLabels = vi.fn();
    const setFailed = vi.fn();
    const info = vi.fn();

    await runAction({
      getInput: createGetInput({
        config: 'examples/basic/.maintainer-agent.yml',
        mode: 'triage',
        'dry-run': 'true'
      }),
      setFailed,
      info,
      addLabelsToIssue: addLabels,
      githubContext: {
        repo: {
          owner: 'example',
          repo: 'project'
        }
      } as never,
      env: {
        GITHUB_EVENT_PATH: 'fixtures/issue.bug.json'
      }
    });

    expect(addLabels).not.toHaveBeenCalled();
    expect(setFailed).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith('Labels to add: bug');
    expect(info).toHaveBeenCalledWith('Dry run enabled. No GitHub labels were applied.');
  });

  it('fails clearly for unsupported mode', async () => {
    const setFailed = vi.fn();

    await runAction({
      getInput: createGetInput({
        config: 'examples/basic/.maintainer-agent.yml',
        mode: 'release-notes',
        'dry-run': 'true'
      }),
      setFailed,
      info: vi.fn(),
      addLabelsToIssue: vi.fn(),
      githubContext: {} as never,
      env: {
        GITHUB_EVENT_PATH: 'fixtures/issue.bug.json'
      }
    });

    expect(setFailed).toHaveBeenCalledWith(
      'Unsupported mode: release-notes. MVP supports only triage.'
    );
  });

  it('exits successfully for unsupported events', async () => {
    const addLabels = vi.fn();
    const setFailed = vi.fn();
    const info = vi.fn();

    await runAction({
      getInput: createGetInput({
        config: 'examples/basic/.maintainer-agent.yml',
        mode: 'triage',
        'dry-run': 'false'
      }),
      setFailed,
      info,
      addLabelsToIssue: addLabels,
      githubContext: {} as never,
      env: {
        GITHUB_EVENT_PATH: 'fixtures/events/no-issue.json'
      }
    });

    expect(addLabels).not.toHaveBeenCalled();
    expect(setFailed).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith('No supported issue payload found. Nothing to triage.');
  });

  it('applies labels when dry-run is false', async () => {
    const addLabels = vi.fn();
    const setFailed = vi.fn();

    await runAction({
      getInput: createGetInput({
        config: 'examples/basic/.maintainer-agent.yml',
        mode: 'triage',
        'dry-run': 'false'
      }),
      setFailed,
      info: vi.fn(),
      addLabelsToIssue: addLabels,
      githubContext: {
        repo: {
          owner: 'example',
          repo: 'project'
        }
      } as never,
      env: {
        GITHUB_EVENT_PATH: 'fixtures/issue.bug.json',
        GITHUB_TOKEN: 'token'
      }
    });

    expect(setFailed).not.toHaveBeenCalled();
    expect(addLabels).toHaveBeenCalledWith({
      token: 'token',
      owner: 'example',
      repo: 'project',
      issueNumber: 108,
      labels: ['bug']
    });
  });
});

describe('GitHub label helper', () => {
  it('does nothing when labels array is empty', async () => {
    await expect(
      addLabelsToIssue({
        token: '',
        owner: 'example',
        repo: 'project',
        issueNumber: 1,
        labels: []
      })
    ).resolves.toBeUndefined();
  });
});
