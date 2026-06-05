import fs from 'fs-extra';

export async function pathExists(path: string): Promise<boolean> {
  return fs.pathExists(path);
}

export async function readTextFile(path: string): Promise<string> {
  return fs.readFile(path, 'utf8');
}

export async function readJsonFile<T>(path: string): Promise<T> {
  return fs.readJson(path) as Promise<T>;
}
