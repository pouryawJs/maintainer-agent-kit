import type { Command } from 'commander';
import type { Logger } from '../utils/logger';

export function registerReleaseNotesCommand(program: Command, logger: Logger): void {
  program
    .command('release-notes')
    .description('Generate release notes from local pull request data.')
    .action(() => {
      logger.info('release-notes command is not implemented yet');
    });
}
