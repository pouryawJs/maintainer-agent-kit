export interface LabelRule {
  include: string[];
  exclude?: string[];
}

export interface GoodFirstIssueConfig {
  enabled: boolean;
  labels: string[];
  include: string[];
}

export interface ReleaseNotesConfig {
  title: string;
  groupByLabels: Record<string, string>;
  includePullRequestLinks: boolean;
}

export interface MaintainerAgentConfig {
  labels: Record<string, LabelRule>;
  goodFirstIssue?: GoodFirstIssueConfig;
  releaseNotes?: ReleaseNotesConfig;
}

export interface IssueInput {
  title: string;
  body?: string | null;
  labels?: string[];
}

export interface PullRequestInput {
  number: number;
  title: string;
  url?: string;
  labels?: string[];
}
