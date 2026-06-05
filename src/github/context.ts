import { MaintainerAgentError } from '../utils/errors';

type MinimalGitHubContext = {
  repo?: {
    owner?: string;
    repo?: string;
  };
};

type IssueContextParams = {
  githubContext: MinimalGitHubContext;
  payload: unknown;
  issueNumber?: number;
};

export type IssueContext = {
  owner: string;
  repo: string;
  issueNumber: number;
};

export function getIssueContext({
  githubContext,
  payload,
  issueNumber
}: IssueContextParams): IssueContext {
  const owner = githubContext.repo?.owner;
  const repo = githubContext.repo?.repo;
  const resolvedIssueNumber = issueNumber ?? getPayloadIssueNumber(payload);

  if (!owner || !repo) {
    throw new MaintainerAgentError('Unable to determine GitHub repository owner and name.');
  }

  if (typeof resolvedIssueNumber !== 'number') {
    throw new MaintainerAgentError('Unable to determine GitHub issue number.');
  }

  return {
    owner,
    repo,
    issueNumber: resolvedIssueNumber
  };
}

function getPayloadIssueNumber(payload: unknown): number | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const issue = (payload as { issue?: { number?: unknown } }).issue;

  return typeof issue?.number === 'number' ? issue.number : undefined;
}
