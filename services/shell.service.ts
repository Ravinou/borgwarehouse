import path from 'path';
import { promisify } from 'util';
import { execFile as execFileCallback } from 'node:child_process';
import { LastSaveDTO, StorageUsedDTO, StorageTargetStatusDTO } from '~/types';
import repositoryNameCheck from '~/helpers/functions/repositoryNameCheck';
import { isValidStorageTarget } from '~/helpers/functions';

const execFile = promisify(execFileCallback);
const shellsDirectory = path.join(process.cwd(), '/helpers/shells');

// This is to prevent the cronjob from being executed multiple times
let isLastSaveListRunning = false;
let isStorageUsedRunning = false;

// Per-repository guard: prevents launching a second `borg compact` on a
// repository while a previous one is still running (which would otherwise fail
// on borg's own lock). Compaction of different repositories stays independent.
const compactingRepos = new Set<string>();

function isValidSshKey(key: string): boolean {
  return /^ssh-(rsa|ed25519|ed25519-sk) [A-Za-z0-9+/=]+(\s.+)?$/.test(key.trim());
}

export const ShellService = {
  getLastSaveList: async (): Promise<LastSaveDTO[]> => {
    if (isLastSaveListRunning) {
      throw new Error('The check status service is already running');
    } else {
      isLastSaveListRunning = true;
    }

    try {
      const { stdout } = await execFile(`${shellsDirectory}/getLastSave.sh`);
      return JSON.parse(stdout || '[]');
    } finally {
      isLastSaveListRunning = false;
    }
  },

  getStorageUsed: async (): Promise<StorageUsedDTO[]> => {
    if (isStorageUsedRunning) {
      throw new Error('The storage used service is already running');
    } else {
      isStorageUsedRunning = true;
    }
    try {
      const { stdout } = await execFile(`${shellsDirectory}/getStorageUsed.sh`);
      return JSON.parse(stdout || '[]');
    } finally {
      isStorageUsedRunning = false;
    }
  },

  deleteRepo: async (repositoryName: string) => {
    const { stdout, stderr } = await execFile(`${shellsDirectory}/deleteRepo.sh`, [repositoryName]);
    return { stdout, stderr };
  },

  compactRepo: async (repositoryName: string) => {
    if (!repositoryNameCheck(repositoryName)) {
      throw new Error('Invalid repository name format');
    }
    if (compactingRepos.has(repositoryName)) {
      throw new Error('A compaction is already running for this repository');
    }
    compactingRepos.add(repositoryName);
    try {
      const { stdout, stderr } = await execFile(`${shellsDirectory}/compactRepo.sh`, [
        repositoryName,
      ]);
      return { stdout, stderr };
    } finally {
      compactingRepos.delete(repositoryName);
    }
  },

  breakLockRepo: async (repositoryName: string) => {
    if (!repositoryNameCheck(repositoryName)) {
      throw new Error('Invalid repository name format');
    }
    const { stdout, stderr } = await execFile(`${shellsDirectory}/breakLockRepo.sh`, [
      repositoryName,
    ]);
    return { stdout, stderr };
  },

  updateRepo: async (
    repositoryName: string,
    sshPublicKey: string,
    storageSize: number,
    appendOnlyMode: boolean
  ) => {
    if (!isValidSshKey(sshPublicKey)) {
      throw new Error('Invalid SSH key format');
    }
    if (!repositoryNameCheck(repositoryName)) {
      throw new Error('Invalid repository name format');
    }

    const { stdout, stderr } = await execFile(`${shellsDirectory}/updateRepo.sh`, [
      repositoryName,
      sshPublicKey,
      storageSize.toString(),
      appendOnlyMode.toString(),
    ]);
    return { stdout, stderr };
  },

  createRepo: async (
    sshPublicKey: string,
    storageSize: number,
    appendOnlyMode: boolean,
    storageTarget?: string
  ): Promise<{ stdout?: string; stderr?: string }> => {
    if (!isValidSshKey(sshPublicKey)) {
      throw new Error('Invalid SSH key format');
    }

    const args = [sshPublicKey, storageSize.toString(), appendOnlyMode.toString()];

    if (storageTarget) {
      if (!isValidStorageTarget(storageTarget)) {
        throw new Error('Invalid storage target');
      }
      args.push(storageTarget);
    }

    const { stdout, stderr } = await execFile(`${shellsDirectory}/createRepo.sh`, args);
    return { stdout, stderr };
  },

  checkStorageTargets: async (storageTargets: string[]): Promise<StorageTargetStatusDTO[]> => {
    const validTargets = storageTargets.filter((target) => isValidStorageTarget(target));
    if (validTargets.length === 0) {
      return [];
    }

    const { stdout } = await execFile(`${shellsDirectory}/checkStorageTargets.sh`, validTargets);
    return JSON.parse(stdout || '[]');
  },
};
