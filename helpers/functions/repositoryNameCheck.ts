// BorgWarehouse repository name is an 8-character hexadecimal string

export default function repositoryNameCheck(name: unknown): boolean {
  if (typeof name !== 'string') {
    return false;
  }
  const repositoryNameRegex = /^[a-f0-9]{8}$/;
  return repositoryNameRegex.test(name) ? true : false;
}
