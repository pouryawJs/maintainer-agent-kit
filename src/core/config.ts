import { readFile } from 'fs-extra';
import { YAMLParseError, parse } from 'yaml';
import { ZodError } from 'zod';
import { configSchema } from '../schemas/config.schema';
import { formatZodError, MaintainerAgentError } from '../utils/errors';
import { pathExists } from '../utils/file';
import type { MaintainerAgentConfig } from './types';

export async function loadConfig(configPath: string): Promise<MaintainerAgentConfig> {
  if (!(await pathExists(configPath))) {
    throw new MaintainerAgentError(`Config file not found: ${configPath}`);
  }

  let rawConfig: string;

  try {
    rawConfig = await readFile(configPath, 'utf8');
  } catch (error) {
    throw new MaintainerAgentError(`Unable to read config file: ${configPath}`, { cause: error });
  }

  let parsedConfig: unknown;

  try {
    parsedConfig = parse(rawConfig);
  } catch (error) {
    if (error instanceof YAMLParseError) {
      throw new MaintainerAgentError(
        `Invalid YAML in config file: ${configPath}. ${error.message}`,
        { cause: error }
      );
    }

    throw new MaintainerAgentError(`Unable to parse config file: ${configPath}`, { cause: error });
  }

  try {
    return configSchema.parse(parsedConfig) as MaintainerAgentConfig;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new MaintainerAgentError(
        `Invalid config file: ${configPath}.\n${formatZodError(error)}`,
        { cause: error }
      );
    }

    throw error;
  }
}
