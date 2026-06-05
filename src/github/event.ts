export interface GitHubEvent {
  name: string;
  payloadPath?: string;
}

export function getGitHubEvent(): GitHubEvent {
  // TODO: Read GitHub Action event context in the action integration phase.
  return {
    name: process.env.GITHUB_EVENT_NAME ?? 'unknown',
    payloadPath: process.env.GITHUB_EVENT_PATH
  };
}
