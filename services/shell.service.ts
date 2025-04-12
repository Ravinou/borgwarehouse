import path from 'path';
import { promisify } from 'util';
import { exec as execCallback } from 'node:child_process';
import { LastSaveDTO, StorageUsedDTO } from '~/types';

const exec = promisify(execCallback);
const shellsDirectory = path.join(process.cwd(), '/helpers/shells');

// This is to prevent the cronjob from being executed multiple times
let isLastSaveListRunning = false;
let isStorageUsedRunning = false;

export const ShellService = {
  getLastSaveList: async (): Promise<LastSaveDTO[]> => {
    if (isLastSaveListRunning) {
      throw new Error('The check status service is already running');
    } else {
      isLastSaveListRunning = true;
    }

    try {
      const { stdout } = await exec(`${shellsDirectory}/getLastSave.sh`);
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
      const { stdout } = await exec(`${shellsDirectory}/getStorageUsed.sh`);
      return JSON.parse(stdout || '[]');
    } finally {
      isStorageUsedRunning = false;
    }
  },

  deleteRepo: async (repositoryName: string) => {
    const { stdout, stderr } = await exec(`${shellsDirectory}/deleteRepo.sh ${repositoryName}`);
    return { stdout, stderr };
  },

  updateRepo: async (
    repositoryName: string,
    sshPublicKey: string,
    storageSize: number,
    appendOnlyMode: boolean
  ) => {
    const { stdout, stderr } = await exec(
      `${shellsDirectory}/updateRepo.sh ${repositoryName} "${sshPublicKey}" ${storageSize} ${appendOnlyMode}`
    );
    return { stdout, stderr };
  },

  createRepo: async (
    sshPublicKey: string,
    storageSize: number,
    appendOnlyMode: boolean
  ): Promise<{ stdout?: string; stderr?: string }> => {
    const { stdout, stderr } = await exec(
      `${shellsDirectory}/createRepo.sh "${sshPublicKey}" ${storageSize} ${appendOnlyMode}`
    );
    return { stdout, stderr };
  },
};
