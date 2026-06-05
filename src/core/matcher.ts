import type { IssueLike, MaintainerAgentConfig } from './types';

export function matchLabels(
  _issue: IssueLike,
  _config: MaintainerAgentConfig
): string[] {
  // TODO: Implement keyword matching and exclusion rules.
  return [];
}
