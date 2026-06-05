import { Command } from 'commander';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadIssueFromEvent, registerTriageCommand } from '../src/commands/triage';
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

describe('loadIssueFromEvent', () => {
  it('maps a GitHub issue event payload to IssueLike', async () => {
    await expect(loadIssueFromEvent('fixtures/issue.bug.json')).resolves.toEqual({
      number: 108,
      title: 'App crashes when config file is missing',
      body: 'The CLI exits unexpectedly instead of showing a friendly validation error.',
      labels: undefined
    });
  });

  it('throws a friendly error for a missing event file', async () => {
    await expect(loadIssueFromEvent('fixtures/events/missing.json')).rejects.toThrow(
      'Event file not found'
    );
  });

  it('throws a friendly error for invalid event JSON', async () => {
    await expect(loadIssueFromEvent('fixtures/events/invalid-json.json')).rejects.toThrow(
      'Invalid JSON in event file'
    );
  });

  it('throws a friendly error for an unsupported event payload', async () => {
    await expect(loadIssueFromEvent('fixtures/events/no-issue.json')).rejects.toThrow(
      'supported issue payload'
    );
  });
});

describe('triage command', () => {
  afterEach(() => {
    process.exitCode = undefined;
  });

  it('prints a readable dry-run summary for matched labels', async () => {
    const logger = createMockLogger();
    const program = new Command();
    program.exitOverride();
    registerTriageCommand(program, logger);

    await program.parseAsync(
      [
        'node',
        'mak',
        'triage',
        '--config',
        'examples/basic/.maintainer-agent.yml',
        '--event',
        'fixtures/issue.bug.json'
      ],
      { from: 'node' }
    );

    expect(logger.success).toHaveBeenCalledWith('Triage dry run complete.');
    expect(logger.info).toHaveBeenCalledWith('Event file: fixtures/issue.bug.json');
    expect(logger.info).toHaveBeenCalledWith(
      'Config file: examples/basic/.maintainer-agent.yml'
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Issue: #108 App crashes when config file is missing'
    );
    expect(logger.info).toHaveBeenCalledWith('Labels to add: bug');
    expect(logger.info).toHaveBeenCalledWith('Matched rules:');
    expect(logger.info).toHaveBeenCalledWith('- bug: error, crash');
    expect(logger.warn).toHaveBeenCalledWith('Dry run only. No GitHub labels were applied.');
    expect(process.exitCode).toBeUndefined();
  });

  it('prints a friendly error for invalid event JSON', async () => {
    const logger = createMockLogger();
    const program = new Command();
    program.exitOverride();
    registerTriageCommand(program, logger);

    await program.parseAsync(
      [
        'node',
        'mak',
        'triage',
        '--config',
        'examples/basic/.maintainer-agent.yml',
        '--event',
        'fixtures/events/invalid-json.json'
      ],
      { from: 'node' }
    );

    expect(logger.error).toHaveBeenCalledWith(
      'Invalid JSON in event file: fixtures/events/invalid-json.json'
    );
    expect(process.exitCode).toBe(1);
  });
});
