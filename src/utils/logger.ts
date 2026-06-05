import chalk from 'chalk';

export interface Logger {
  banner(message: string): void;
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export function createLogger(): Logger {
  return {
    banner(message: string): void {
      console.log(chalk.bold.cyan(message));
    },
    info(message: string): void {
      console.log(chalk.blue(message));
    },
    success(message: string): void {
      console.log(chalk.green(message));
    },
    warn(message: string): void {
      console.warn(chalk.yellow(message));
    },
    error(message: string): void {
      console.error(chalk.red(message));
    }
  };
}
