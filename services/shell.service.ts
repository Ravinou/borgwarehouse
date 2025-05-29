import path from 'path';
import { promisify } from 'util';
import { execFile as execFileCallback } from 'node:child_process';
import { LastSaveDTO, StorageUsedDTO } from '~/types';
import repositoryNameCheck from '~/helpers/functions/repositoryNameCheck';

const execFile = promisify(execFileCallback);
const shellsDirectory = path.join(process.cwd(), '/helpers/shells');

// This is to prevent the cronjob from being executed multiple times
let isLastSaveListRunning = false;
let isStorageUsedRunning = false;

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
    appendOnlyMode: boolean
  ): Promise<{ stdout?: string; stderr?: string }> => {
    if (!isValidSshKey(sshPublicKey)) {
      throw new Error('Invalid SSH key format');
    }

    const { stdout, stderr } = await execFile(`${shellsDirectory}/createRepo.sh`, [
      sshPublicKey,
      storageSize.toString(),
      appendOnlyMode.toString(),
    ]);
    return { stdout, stderr };
  },
};
