import * as core from '@actions/core';
import * as github from '@actions/github';
import { loadConfig } from './core/config';
import { triageIssue } from './core/triage';
import type { TriageResult } from './core/types';
import { getIssueContext } from './github/context';
import { getIssueFromEventPayload, readGitHubEventPayload } from './github/event';
import { addLabelsToIssue } from './github/labels';
import { MaintainerAgentError, toUserMessage } from './utils/errors';

type ActionDeps = {
  getInput?: (name: string) => string;
  setFailed?: (message: string) => void;
  info?: (message: string) => void;
  addLabelsToIssue?: typeof addLabelsToIssue;
  githubContext?: typeof github.context;
  env?: NodeJS.ProcessEnv;
};

type ActionInputs = {
  configPath: string;
  mode: string;
  dryRun: boolean;
};

export async function runAction(deps: ActionDeps = {}): Promise<void> {
  const getInput = deps.getInput ?? core.getInput;
  const setFailed = deps.setFailed ?? core.setFailed;
  const info = deps.info ?? core.info;
  const labelApplier = deps.addLabelsToIssue ?? addLabelsToIssue;
  const githubContext = deps.githubContext ?? github.context;
  const env = deps.env ?? process.env;

  try {
    info('maintainer-agent-kit v0.1.0');

    const inputs = getActionInputs(getInput);

    if (inputs.mode !== 'triage') {
      throw new MaintainerAgentError(
        `Unsupported mode: ${inputs.mode}. MVP supports only triage.`
      );
    }

    const eventPath = env.GITHUB_EVENT_PATH;

    if (!eventPath) {
      throw new MaintainerAgentError('GITHUB_EVENT_PATH is required.');
    }

    const config = await loadConfig(inputs.configPath);
    const payload = await readGitHubEventPayload(eventPath);
    const issue = getIssueFromEventPayload(payload);

    if (!issue) {
      info('No supported issue payload found. Nothing to triage.');
      return;
    }

    const result = await triageIssue(issue, config);
    printTriageSummary(info, issue.number, issue.title, result);

    if (result.labelsToAdd.length === 0) {
      info('No labels are needed.');
      return;
    }

    if (inputs.dryRun) {
      info('Dry run enabled. No GitHub labels were applied.');
      return;
    }

    const token = env.GITHUB_TOKEN;

    if (!token) {
      throw new MaintainerAgentError('GITHUB_TOKEN is required when dry-run is false.');
    }

    const issueContext = getIssueContext({
      githubContext,
      payload,
      issueNumber: issue.number
    });

    await labelApplier({
      token,
      owner: issueContext.owner,
      repo: issueContext.repo,
      issueNumber: issueContext.issueNumber,
      labels: result.labelsToAdd
    });

    info(`Applied labels: ${result.labelsToAdd.join(', ')}`);
  } catch (error) {
    setFailed(toUserMessage(error));
  }
}

function getActionInputs(getInput: (name: string) => string): ActionInputs {
  return {
    configPath: getInput('config') || '.maintainer-agent.yml',
    mode: getInput('mode') || 'triage',
    dryRun: parseBooleanInput(getInput('dry-run') || 'false')
  };
}

function parseBooleanInput(value: string): boolean {
  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function printTriageSummary(
  info: (message: string) => void,
  issueNumber: number | undefined,
  issueTitle: string,
  result: TriageResult
): void {
  info(`Issue: ${issueNumber ? `#${issueNumber} ` : ''}${issueTitle}`);
  info(
    `Labels to add: ${result.labelsToAdd.length > 0 ? result.labelsToAdd.join(', ') : 'none'}`
  );

  if (result.matchedRules.length === 0) {
    info('Matched rules: none');
    return;
  }

  info('Matched rules:');

  for (const rule of result.matchedRules) {
    info(`- ${rule.label}: ${rule.matchedKeywords.join(', ')}`);
  }
}

if (require.main === module) {
  void runAction();
}
