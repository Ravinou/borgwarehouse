import path from 'path';
import { promisify } from 'util';
import { exec as execCallback } from 'node:child_process';
import { LastSaveDTO, StorageUsedDTO } from '~/types/api/shell.types';

const exec = promisify(execCallback);
const shellsDirectory = path.join(process.cwd(), '/helpers/shells');

export const ShellService = {
  getLastSaveList: async (): Promise<LastSaveDTO[]> => {
    const { stdout } = await exec(`${shellsDirectory}/getLastSave.sh`);
    return JSON.parse(stdout || '[]');
  },

  getStorageUsed: async (): Promise<StorageUsedDTO[]> => {
    const { stdout } = await exec(`${shellsDirectory}/getStorageUsed.sh`);
    return JSON.parse(stdout || '[]');
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
