import fs from 'fs-extra';

export async function pathExists(path: string): Promise<boolean> {
  return fs.pathExists(path);
}

export async function readJsonFile<T>(path: string): Promise<T> {
  return fs.readJson(path) as Promise<T>;
}
