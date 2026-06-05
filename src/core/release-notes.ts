import type { MaintainerAgentConfig, PullRequestLike } from './types';

type GenerateReleaseNotesParams = {
  pullRequests: PullRequestLike[];
  config: MaintainerAgentConfig;
};

type ReleaseNotesSettings = {
  title: string;
  groupByLabels: Record<string, string>;
  includePullRequestLinks: boolean;
};

export function generateReleaseNotes({
  pullRequests,
  config
}: GenerateReleaseNotesParams): string {
  const settings = getReleaseNotesSettings(config);
  const sortedPullRequests = [...pullRequests].sort((left, right) => left.number - right.number);
  const lines: string[] = [`# ${settings.title}`, ''];

  if (sortedPullRequests.length === 0) {
    return `${lines.concat('No pull requests found.').join('\n')}\n`;
  }

  const groupedPullRequests = groupPullRequests(sortedPullRequests, settings.groupByLabels);

  for (const [heading, groupPullRequests] of groupedPullRequests) {
    if (groupPullRequests.length === 0) {
      continue;
    }

    lines.push(`## ${heading}`);

    for (const pullRequest of groupPullRequests) {
      lines.push(formatPullRequest(pullRequest, settings.includePullRequestLinks));
    }

    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function getReleaseNotesSettings(config: MaintainerAgentConfig): ReleaseNotesSettings {
  return {
    title: config.releaseNotes?.title ?? 'Release Notes',
    groupByLabels: config.releaseNotes?.groupByLabels ?? {},
    includePullRequestLinks: config.releaseNotes?.includePullRequestLinks ?? true
  };
}

function groupPullRequests(
  pullRequests: PullRequestLike[],
  groupByLabels: Record<string, string>
): Array<[string, PullRequestLike[]]> {
  const configuredGroups = Object.entries(groupByLabels).map(
    ([label, heading]) => [label, heading, [] as PullRequestLike[]] as const
  );
  const otherPullRequests: PullRequestLike[] = [];

  for (const pullRequest of pullRequests) {
    const matchingGroup = configuredGroups.find(([label]) => pullRequest.labels.includes(label));

    if (matchingGroup) {
      matchingGroup[2].push(pullRequest);
    } else {
      otherPullRequests.push(pullRequest);
    }
  }

  return [
    ...configuredGroups.map(([, heading, groupedPullRequests]) => [
      heading,
      groupedPullRequests
    ] as [string, PullRequestLike[]]),
    ['Other Changes', otherPullRequests]
  ];
}

function formatPullRequest(
  pullRequest: PullRequestLike,
  includePullRequestLinks: boolean
): string {
  const reference =
    includePullRequestLinks && pullRequest.url
      ? `([#${pullRequest.number}](${pullRequest.url}))`
      : `(#${pullRequest.number})`;
  const author = pullRequest.author ? ` by @${pullRequest.author}` : '';

  return `- ${pullRequest.title} ${reference}${author}`;
}
