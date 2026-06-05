import type { Command } from 'commander';
import type { Logger } from '../utils/logger';

export function registerValidateCommand(program: Command, logger: Logger): void {
  program
    .command('validate')
    .description('Validate a maintainer-agent-kit configuration file.')
    .action(() => {
      logger.info('validate command is not implemented yet');
    });
}
