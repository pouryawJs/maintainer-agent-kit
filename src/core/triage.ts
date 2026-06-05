import type { IssueLike, MaintainerAgentConfig, TriageResult } from './types';

export function triageIssue(
  _issue: IssueLike,
  _config: MaintainerAgentConfig
): TriageResult {
  // TODO: Combine label matching and good-first-issue hints.
  return {
    labelsToAdd: [],
    matchedRules: []
  };
}
