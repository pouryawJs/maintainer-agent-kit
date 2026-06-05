import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/core/config';
import { MaintainerAgentError } from '../src/utils/errors';

const fixturePath = (name: string): string => `fixtures/configs/${name}`;

describe('loadConfig', () => {
  it('loads a valid config successfully', async () => {
    const config = await loadConfig(fixturePath('valid.yml'));

    expect(Object.keys(config.labels)).toEqual(['bug', 'docs']);
    expect(config.labels.bug.include).toEqual(['bug', 'crash']);
  });

  it('throws a friendly error for a missing config file', async () => {
    await expect(loadConfig(fixturePath('missing.yml'))).rejects.toThrow(MaintainerAgentError);
    await expect(loadConfig(fixturePath('missing.yml'))).rejects.toThrow('Config file not found');
  });

  it('throws a friendly error for invalid YAML', async () => {
    await expect(loadConfig(fixturePath('invalid-yaml.yml'))).rejects.toThrow(MaintainerAgentError);
    await expect(loadConfig(fixturePath('invalid-yaml.yml'))).rejects.toThrow(
      'Invalid YAML in config file'
    );
  });

  it('fails validation when labels are missing', async () => {
    await expect(loadConfig(fixturePath('invalid-missing-labels.yml'))).rejects.toThrow(
      'Invalid config file'
    );
    await expect(loadConfig(fixturePath('invalid-missing-labels.yml'))).rejects.toThrow('labels');
  });

  it('fails validation when a label include array is empty', async () => {
    await expect(loadConfig(fixturePath('invalid-empty-include.yml'))).rejects.toThrow(
      'labels.bug.include'
    );
  });

  it('applies defaults for optional releaseNotes fields', async () => {
    const config = await loadConfig(fixturePath('valid.yml'));

    expect(config.releaseNotes).toEqual({
      title: 'Release Notes',
      groupByLabels: {
        bug: 'Bug Fixes'
      },
      includePullRequestLinks: true
    });
  });

  it('applies the goodFirstIssue.enabled default when omitted', async () => {
    const config = await loadConfig(fixturePath('valid.yml'));

    expect(config.goodFirstIssue?.enabled).toBe(false);
  });

  it('rejects unknown top-level fields', async () => {
    await expect(loadConfig(fixturePath('invalid-unknown-field.yml'))).rejects.toThrow(
      'Unrecognized key'
    );
  });
});
