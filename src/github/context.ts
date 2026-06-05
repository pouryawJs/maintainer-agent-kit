export interface RepositoryContext {
  owner: string;
  repo: string;
}

export function getRepositoryContext(): RepositoryContext | undefined {
  const repository = process.env.GITHUB_REPOSITORY;

  if (!repository) {
    return undefined;
  }

  const [owner, repo] = repository.split('/');

  if (!owner || !repo) {
    return undefined;
  }

  return { owner, repo };
}
