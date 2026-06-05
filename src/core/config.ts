import type { MaintainerAgentConfig } from './types';

export async function loadConfig(_path: string): Promise<MaintainerAgentConfig> {
  // TODO: Parse YAML and validate with configSchema in the config phase.
  throw new Error('Config loading is not implemented yet.');
}
