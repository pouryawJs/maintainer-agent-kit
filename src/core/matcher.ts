import type { IssueLike, MaintainerAgentConfig, TriageResult } from './types';

export function normalizeText(input: string | null | undefined): string {
  return (input ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function findMatchedKeywords(text: string, keywords: string[]): string[] {
  const normalizedText = normalizeText(text);
  const matchedKeywords: string[] = [];
  const seenKeywords = new Set<string>();

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);

    if (!normalizedKeyword || seenKeywords.has(normalizedKeyword)) {
      continue;
    }

    seenKeywords.add(normalizedKeyword);

    if (normalizedText.includes(normalizedKeyword)) {
      matchedKeywords.push(normalizedKeyword);
    }
  }

  return matchedKeywords;
}

export function matchLabels(issue: IssueLike, config: MaintainerAgentConfig): TriageResult {
  const issueText = normalizeText(`${issue.title} ${issue.body ?? ''}`);
  const labelsToAdd: string[] = [];
  const matchedRules: TriageResult['matchedRules'] = [];
  const seenLabels = new Set<string>();

  for (const [label, rule] of Object.entries(config.labels)) {
    const matchedKeywords = findMatchedKeywords(issueText, rule.include);

    if (matchedKeywords.length === 0) {
      continue;
    }

    if (!seenLabels.has(label)) {
      labelsToAdd.push(label);
      seenLabels.add(label);
    }

    matchedRules.push({
      label,
      matchedKeywords
    });
  }

  if (config.goodFirstIssue?.enabled) {
    const matchedKeywords = findMatchedKeywords(issueText, config.goodFirstIssue.include);

    if (matchedKeywords.length > 0) {
      for (const label of config.goodFirstIssue.labels) {
        if (seenLabels.has(label)) {
          continue;
        }

        labelsToAdd.push(label);
        seenLabels.add(label);
      }

      matchedRules.push({
        label: 'goodFirstIssue',
        matchedKeywords
      });
    }
  }

  return {
    labelsToAdd,
    matchedRules
  };
}
