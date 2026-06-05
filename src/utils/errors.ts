export class MaintainerAgentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MaintainerAgentError';
  }
}

export function toUserMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred.';
}
