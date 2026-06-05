import type { IssueLike } from '../core/types';
import { MaintainerAgentError } from '../utils/errors';
import { pathExists, readTextFile } from '../utils/file';

type GitHubIssuePayload = {
  issue?: {
    number?: unknown;
    title?: unknown;
    body?: unknown;
    labels?: unknown;
  };
};

export async function readGitHubEventPayload(eventPath: string): Promise<unknown> {
  if (!(await pathExists(eventPath))) {
    throw new MaintainerAgentError(`GitHub event file not found: ${eventPath}`);
  }

  let rawPayload: string;

  try {
    rawPayload = await readTextFile(eventPath);
  } catch (error) {
    throw new MaintainerAgentError(`Unable to read GitHub event file: ${eventPath}`, {
      cause: error
    });
  }

  try {
    return JSON.parse(rawPayload);
  } catch (error) {
    throw new MaintainerAgentError(`Invalid JSON in GitHub event file: ${eventPath}`, {
      cause: error
    });
  }
}

export function getIssueFromEventPayload(payload: unknown): IssueLike | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const issue = (payload as GitHubIssuePayload).issue;

  if (
    !issue ||
    typeof issue.number !== 'number' ||
    typeof issue.title !== 'string'
  ) {
    return null;
  }

  return {
    number: issue.number,
    title: issue.title,
    body: typeof issue.body === 'string' || issue.body === null ? issue.body : undefined,
    labels: normalizeIssueLabels(issue.labels)
  };
}

function normalizeIssueLabels(labels: unknown): string[] | undefined {
  if (!Array.isArray(labels)) {
    return undefined;
  }

  const labelNames = labels
    .map((label) => {
      if (typeof label === 'string') {
        return label;
      }

      if (
        label &&
        typeof label === 'object' &&
        'name' in label &&
        typeof label.name === 'string'
      ) {
        return label.name;
      }

      return undefined;
    })
    .filter((label): label is string => Boolean(label));

  return labelNames.length > 0 ? labelNames : undefined;
}
