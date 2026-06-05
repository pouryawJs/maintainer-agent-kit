import type { Command } from 'commander';
import type { Logger } from '../utils/logger';

export function registerTriageCommand(program: Command, logger: Logger): void {
  program
    .command('triage')
    .description('Run rule-based issue triage.')
    .action(() => {
      logger.info('triage command is not implemented yet');
    });
}
