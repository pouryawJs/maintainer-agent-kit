import { Command } from 'commander';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerValidateCommand } from '../src/commands/validate';
import type { Logger } from '../src/utils/logger';

function createMockLogger(): Logger {
  return {
    banner: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };
}

describe('validate command', () => {
  afterEach(() => {
    process.exitCode = undefined;
  });

  it('prints a readable summary for a valid config', async () => {
    const logger = createMockLogger();
    const program = new Command();
    program.exitOverride();
    registerValidateCommand(program, logger);

    await program.parseAsync(
      ['node', 'mak', 'validate', '--config', 'examples/basic/.maintainer-agent.yml'],
      { from: 'node' }
    );

    expect(logger.success).toHaveBeenCalledWith(
      'Config is valid: examples/basic/.maintainer-agent.yml'
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Labels configured: bug, feature, docs, question'
    );
    expect(logger.info).toHaveBeenCalledWith('Good first issue detection: enabled');
    expect(logger.info).toHaveBeenCalledWith('Release notes title: Release Notes');
    expect(process.exitCode).toBeUndefined();
  });

  it('prints a friendly error for an invalid config', async () => {
    const logger = createMockLogger();
    const program = new Command();
    program.exitOverride();
    registerValidateCommand(program, logger);

    await program.parseAsync(
      ['node', 'mak', 'validate', '--config', 'fixtures/configs/invalid-missing-labels.yml'],
      { from: 'node' }
    );

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid config file'));
    expect(process.exitCode).toBe(1);
  });
});
