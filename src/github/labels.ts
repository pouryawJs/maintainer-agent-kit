import * as github from '@actions/github';

type AddLabelsToIssueParams = {
  token: string;
  owner: string;
  repo: string;
  issueNumber: number;
  labels: string[];
};

export async function addLabelsToIssue({
  token,
  owner,
  repo,
  issueNumber,
  labels
}: AddLabelsToIssueParams): Promise<void> {
  if (labels.length === 0) {
    return;
  }

  const octokit = github.getOctokit(token);

  await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels
  });
}
