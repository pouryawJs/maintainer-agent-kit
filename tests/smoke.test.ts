import { describe, expect, it } from 'vitest';
import { createCli, version } from '../src';

describe('project smoke test', () => {
  it('exposes the expected package version', () => {
    expect(version).toBe('0.1.0');
  });

  it('registers the placeholder CLI commands', () => {
    const commandNames = createCli()
      .commands.map((command) => command.name())
      .sort();

    expect(commandNames).toEqual(['release-notes', 'triage', 'validate']);
  });
});
