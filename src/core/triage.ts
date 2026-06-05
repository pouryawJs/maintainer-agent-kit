import type { IssueInput, MaintainerAgentConfig } from './types';

export interface TriageResult {
  labels: string[];
  reason: string;
}

export function triageIssue(
  _issue: IssueInput,
  _config: MaintainerAgentConfig
): TriageResult {
  // TODO: Combine label matching and good-first-issue hints.
  return {
    labels: [],
    reason: 'Triage engine is not implemented yet.'
  };
}
