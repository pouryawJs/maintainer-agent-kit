import type { IssueLike, MaintainerAgentConfig, TriageResult } from './types';
import { matchLabels } from './matcher';

export async function triageIssue(
  _issue: IssueLike,
  _config: MaintainerAgentConfig
): Promise<TriageResult> {
  return matchLabels(_issue, _config);
}
