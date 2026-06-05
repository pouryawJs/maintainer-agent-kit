import type { MaintainerAgentConfig, PullRequestLike } from './types';

export function generateReleaseNotes(
  _pullRequests: PullRequestLike[],
  _config: MaintainerAgentConfig
): string {
  // TODO: Group merged pull requests by configured labels.
  return 'Release notes generation is not implemented yet.';
}
