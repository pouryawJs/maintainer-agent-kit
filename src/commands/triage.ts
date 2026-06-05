import type { Command } from 'commander';
import { readFile } from 'fs-extra';
import { loadConfig } from '../core/config';
import { triageIssue } from '../core/triage';
import type { IssueLike, TriageResult } from '../core/types';
import { MaintainerAgentError, toUserMessage } from '../utils/errors';
import { pathExists } from '../utils/file';
import type { Logger } from '../utils/logger';

type TriageOptions = {
  config: string;
  event?: string;
};

type IssueEventPayload = {
  issue?: {
    number?: unknown;
    title?: unknown;
    body?: unknown;
    labels?: unknown;
  };
};

export async function loadIssueFromEvent(eventPath: string): Promise<IssueLike> {
  if (!(await pathExists(eventPath))) {
    throw new MaintainerAgentError(`Event file not found: ${eventPath}`);
  }

  let rawEvent: string;

  try {
    rawEvent = await readFile(eventPath, 'utf8');
  } catch (error) {
    throw new MaintainerAgentError(`Unable to read event file: ${eventPath}`, { cause: error });
  }

  let parsedEvent: IssueEventPayload;

  try {
    parsedEvent = JSON.parse(rawEvent) as IssueEventPayload;
  } catch (error) {
    throw new MaintainerAgentError(`Invalid JSON in event file: ${eventPath}`, { cause: error });
  }

  const issue = parsedEvent.issue;

  if (!issue || typeof issue.title !== 'string') {
    throw new MaintainerAgentError(
      `Event file does not contain a supported issue payload: ${eventPath}`
    );
  }

  return {
    number: typeof issue.number === 'number' ? issue.number : undefined,
    title: issue.title,
    body: typeof issue.body === 'string' || issue.body === null ? issue.body : undefined,
    labels: normalizeEventLabels(issue.labels)
  };
}

export function registerTriageCommand(program: Command, logger: Logger): void {
  program
    .command('triage')
    .description('Run rule-based issue triage.')
    .option('-c, --config <path>', 'Path to maintainer-agent-kit config file.', '.maintainer-agent.yml')
    .requiredOption('-e, --event <path>', 'Path to a GitHub issue event JSON file.')
    .action(async (options: TriageOptions) => {
      try {
        const config = await loadConfig(options.config);
        const issue = await loadIssueFromEvent(options.event as string);
        const result = await triageIssue(issue, config);

        printTriageResult(logger, options.event as string, options.config, issue, result);
      } catch (error) {
        logger.error(toUserMessage(error));
        process.exitCode = 1;
      }
    });
}

function normalizeEventLabels(labels: unknown): string[] | undefined {
  if (!Array.isArray(labels)) {
    return undefined;
  }

  const normalizedLabels = labels
    .map((label) => {
      if (typeof label === 'string') {
        return label;
      }

      if (
        label &&
        typeof label === 'object' &&
        'name' in label &&
        typeof label.name === 'string'
      ) {
        return label.name;
      }

      return undefined;
    })
    .filter((label): label is string => Boolean(label));

  return normalizedLabels.length > 0 ? normalizedLabels : undefined;
}

function printTriageResult(
  logger: Logger,
  eventPath: string,
  configPath: string,
  issue: IssueLike,
  result: TriageResult
): void {
  logger.success('Triage dry run complete.');
  logger.info(`Event file: ${eventPath}`);
  logger.info(`Config file: ${configPath}`);
  logger.info(`Issue: ${issue.number ? `#${issue.number} ` : ''}${issue.title}`);
  logger.info(
    `Labels to add: ${result.labelsToAdd.length > 0 ? result.labelsToAdd.join(', ') : 'none'}`
  );

  if (result.matchedRules.length === 0) {
    logger.info('Matched rules: none');
  } else {
    logger.info('Matched rules:');

    for (const rule of result.matchedRules) {
      logger.info(`- ${rule.label}: ${rule.matchedKeywords.join(', ')}`);
    }
  }

  logger.warn('Dry run only. No GitHub labels were applied.');
}
