import type { Command } from 'commander';
import { loadConfig } from '../core/config';
import { toUserMessage } from '../utils/errors';
import type { Logger } from '../utils/logger';

type ValidateOptions = {
  config: string;
};

export function registerValidateCommand(program: Command, logger: Logger): void {
  program
    .command('validate')
    .description('Validate a maintainer-agent-kit configuration file.')
    .option('-c, --config <path>', 'Path to maintainer-agent-kit config file.', '.maintainer-agent.yml')
    .action(async (options: ValidateOptions) => {
      try {
        const config = await loadConfig(options.config);
        const labelNames = Object.keys(config.labels);

        logger.success(`Config is valid: ${options.config}`);
        logger.info(`Labels configured: ${labelNames.join(', ')}`);
        logger.info(
          `Good first issue detection: ${config.goodFirstIssue?.enabled ? 'enabled' : 'disabled'}`
        );

        if (config.releaseNotes) {
          logger.info(`Release notes title: ${config.releaseNotes.title}`);
        }
      } catch (error) {
        logger.error(toUserMessage(error));
        process.exitCode = 1;
      }
    });
}
