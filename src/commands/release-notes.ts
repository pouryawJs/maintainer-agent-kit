import type { Command } from 'commander';
import { loadConfig } from '../core/config';
import { generateReleaseNotes } from '../core/release-notes';
import type { PullRequestLike } from '../core/types';
import { MaintainerAgentError, toUserMessage } from '../utils/errors';
import { pathExists, readTextFile, writeTextFile } from '../utils/file';
import type { Logger } from '../utils/logger';

type ReleaseNotesOptions = {
  config: string;
  prs: string;
  out?: string;
};

export function registerReleaseNotesCommand(program: Command, logger: Logger): void {
  program
    .command('release-notes')
    .description('Generate release notes from local pull request data.')
    .option('-c, --config <path>', 'Path to maintainer-agent-kit config file.', '.maintainer-agent.yml')
    .requiredOption('-p, --prs <path>', 'Path to merged pull request JSON file.')
    .option('-o, --out <path>', 'Path to write release notes Markdown.')
    .action(async (options: ReleaseNotesOptions) => {
      try {
        const config = await loadConfig(options.config);
        const pullRequests = await loadPullRequests(options.prs);
        const markdown = generateReleaseNotes({ pullRequests, config });

        if (options.out) {
          await writeTextFile(options.out, markdown);
          logger.success(`Release notes written to: ${options.out}`);
        } else {
          logger.info(markdown.trimEnd());
        }
      } catch (error) {
        logger.error(toUserMessage(error));
        process.exitCode = 1;
      }
    });
}

export async function loadPullRequests(prsPath: string): Promise<PullRequestLike[]> {
  if (!(await pathExists(prsPath))) {
    throw new MaintainerAgentError(`Pull request file not found: ${prsPath}`);
  }

  let rawPullRequests: string;

  try {
    rawPullRequests = await readTextFile(prsPath);
  } catch (error) {
    throw new MaintainerAgentError(`Unable to read pull request file: ${prsPath}`, {
      cause: error
    });
  }

  let parsedPullRequests: unknown;

  try {
    parsedPullRequests = JSON.parse(rawPullRequests);
  } catch (error) {
    throw new MaintainerAgentError(`Invalid JSON in pull request file: ${prsPath}`, {
      cause: error
    });
  }

  if (!Array.isArray(parsedPullRequests)) {
    throw new MaintainerAgentError(`Pull request file must contain an array: ${prsPath}`);
  }

  return parsedPullRequests.map((pullRequest, index) => toPullRequestLike(pullRequest, index));
}

function toPullRequestLike(value: unknown, index: number): PullRequestLike {
  if (!value || typeof value !== 'object') {
    throw new MaintainerAgentError(`Invalid pull request object at index ${index}: expected object.`);
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.number !== 'number') {
    throw new MaintainerAgentError(
      `Invalid pull request object at index ${index}: number must be a number.`
    );
  }

  if (typeof candidate.title !== 'string') {
    throw new MaintainerAgentError(
      `Invalid pull request object at index ${index}: title must be a string.`
    );
  }

  if (
    !Array.isArray(candidate.labels) ||
    candidate.labels.some((label) => typeof label !== 'string')
  ) {
    throw new MaintainerAgentError(
      `Invalid pull request object at index ${index}: labels must be an array of strings.`
    );
  }

  return {
    number: candidate.number,
    title: candidate.title,
    url: typeof candidate.url === 'string' ? candidate.url : undefined,
    labels: candidate.labels,
    mergedAt: typeof candidate.mergedAt === 'string' ? candidate.mergedAt : undefined,
    author: typeof candidate.author === 'string' ? candidate.author : undefined
  };
}
