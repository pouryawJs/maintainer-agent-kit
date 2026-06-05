export type LabelRule = {
  include: string[];
};

export type GoodFirstIssueConfig = {
  enabled: boolean;
  labels: string[];
  include: string[];
};

export type ReleaseNotesConfig = {
  title: string;
  groupByLabels: Record<string, string>;
  includePullRequestLinks: boolean;
};

export type MaintainerAgentConfig = {
  labels: Record<string, LabelRule>;
  goodFirstIssue?: GoodFirstIssueConfig;
  releaseNotes?: ReleaseNotesConfig;
};

export type IssueLike = {
  number?: number;
  title: string;
  body?: string | null;
  labels?: string[];
};

export type TriageResult = {
  labelsToAdd: string[];
  matchedRules: Array<{
    label: string;
    matchedKeywords: string[];
  }>;
};

export type PullRequestLike = {
  number: number;
  title: string;
  url?: string;
  labels: string[];
  mergedAt?: string;
  author?: string;
};
