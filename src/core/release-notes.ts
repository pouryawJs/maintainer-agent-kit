import type { MaintainerAgentConfig, PullRequestInput } from './types';

export function generateReleaseNotes(
  _pullRequests: PullRequestInput[],
  _config: MaintainerAgentConfig
): string {
  // TODO: Group merged pull requests by configured labels.
  return 'Release notes generation is not implemented yet.';
}
