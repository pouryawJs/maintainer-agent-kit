import * as core from '@actions/core';
import { createLogger } from './utils/logger';

export async function run(): Promise<void> {
  const logger = createLogger();

  try {
    logger.banner('maintainer-agent-kit v0.1.0');
    logger.info('GitHub Action entrypoint is not implemented yet.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown action error occurred.';
    core.setFailed(message);
  }
}

void run();
