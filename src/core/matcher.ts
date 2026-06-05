import type { IssueInput, MaintainerAgentConfig } from './types';

export function matchLabels(
  _issue: IssueInput,
  _config: MaintainerAgentConfig
): string[] {
  // TODO: Implement keyword matching and exclusion rules.
  return [];
}
