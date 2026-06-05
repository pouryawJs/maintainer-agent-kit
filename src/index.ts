#!/usr/bin/env node

import { Command } from 'commander';
import { registerReleaseNotesCommand } from './commands/release-notes';
import { registerTriageCommand } from './commands/triage';
import { registerValidateCommand } from './commands/validate';
import { createLogger } from './utils/logger';

export const version = '0.1.0';

export function createCli(): Command {
  const logger = createLogger();
  const program = new Command();

  program
    .name('maintainer-agent-kit')
    .alias('mak')
    .description('Zero-backend maintainer automation toolkit.')
    .version(version)
    .hook('preAction', () => {
      logger.banner(`maintainer-agent-kit v${version}`);
    });

  registerValidateCommand(program, logger);
  registerTriageCommand(program, logger);
  registerReleaseNotesCommand(program, logger);

  return program;
}

async function main(): Promise<void> {
  const cli = createCli();

  try {
    await cli.parseAsync(process.argv);
  } catch (error) {
    const logger = createLogger();
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    logger.error(message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void main();
}
