import type { ZodError } from 'zod';

export class MaintainerAgentError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'MaintainerAgentError';
  }
}

export function toUserMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred.';
}

export function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'config';
      return `- ${path}: ${issue.message}`;
    })
    .join('\n');
}
