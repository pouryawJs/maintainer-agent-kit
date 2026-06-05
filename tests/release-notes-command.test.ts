import { Command } from 'commander';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerReleaseNotesCommand } from '../src/commands/release-notes';
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

async function runReleaseNotesCommand(args: string[], logger: Logger): Promise<void> {
  const program = new Command();
  program.exitOverride();
  registerReleaseNotesCommand(program, logger);

  await program.parseAsync(['node', 'mak', 'release-notes', ...args], { from: 'node' });
}

describe('release-notes command', () => {
  afterEach(() => {
    process.exitCode = undefined;
  });

  it('prints Markdown to stdout when --out is omitted', async () => {
    const logger = createMockLogger();

    await runReleaseNotesCommand(
      ['--config', 'examples/basic/.maintainer-agent.yml', '--prs', 'fixtures/merged-prs.json'],
      logger
    );

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('# Release Notes'));
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('## Features'));
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('## Other Changes'));
    expect(process.exitCode).toBeUndefined();
  });

  it('writes Markdown to a file when --out is provided', async () => {
    const logger = createMockLogger();
    const tempDir = await mkdtemp(join(tmpdir(), 'mak-release-notes-'));
    const outputPath = join(tempDir, 'RELEASE_NOTES.md');

    try {
      await runReleaseNotesCommand(
        [
          '--config',
          'examples/basic/.maintainer-agent.yml',
          '--prs',
          'fixtures/merged-prs.json',
          '--out',
          outputPath
        ],
        logger
      );

      await expect(readFile(outputPath, 'utf8')).resolves.toContain('# Release Notes');
      expect(logger.success).toHaveBeenCalledWith(`Release notes written to: ${outputPath}`);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('prints a friendly error for a missing PR file', async () => {
    const logger = createMockLogger();

    await runReleaseNotesCommand(
      ['--config', 'examples/basic/.maintainer-agent.yml', '--prs', 'fixtures/missing-prs.json'],
      logger
    );

    expect(logger.error).toHaveBeenCalledWith(
      'Pull request file not found: fixtures/missing-prs.json'
    );
    expect(process.exitCode).toBe(1);
  });

  it('prints a friendly error for invalid PR JSON', async () => {
    const logger = createMockLogger();

    await runReleaseNotesCommand(
      [
        '--config',
        'examples/basic/.maintainer-agent.yml',
        '--prs',
        'fixtures/prs-invalid-json.json'
      ],
      logger
    );

    expect(logger.error).toHaveBeenCalledWith(
      'Invalid JSON in pull request file: fixtures/prs-invalid-json.json'
    );
    expect(process.exitCode).toBe(1);
  });

  it('prints a friendly error when PR JSON is not an array', async () => {
    const logger = createMockLogger();

    await runReleaseNotesCommand(
      ['--config', 'examples/basic/.maintainer-agent.yml', '--prs', 'fixtures/prs-object.json'],
      logger
    );

    expect(logger.error).toHaveBeenCalledWith(
      'Pull request file must contain an array: fixtures/prs-object.json'
    );
    expect(process.exitCode).toBe(1);
  });
});
