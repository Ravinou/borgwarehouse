import path from 'path';
import { promisify } from 'util';
import { exec as execCallback } from 'node:child_process';
import { LastSaveDTO, StorageUsedDTO } from '~/types/api/shell.types';

const exec = promisify(execCallback);

export const getLastSaveListShell = async (): Promise<LastSaveDTO[]> => {
  const shellsDirectory = path.join(process.cwd(), '/helpers');
  const { stdout } = await exec(`${shellsDirectory}/shells/getLastSave.sh`);
  return JSON.parse(stdout || '[]');
};

export const getStorageUsedShell = async (): Promise<StorageUsedDTO[]> => {
  const shellsDirectory = path.join(process.cwd(), '/helpers');
  const { stdout } = await exec(`${shellsDirectory}/shells/getStorageUsed.sh`);
  return JSON.parse(stdout || '[]');
};

export const deleteRepoShell = async (
  repositoryName: string
): Promise<{ stdout: string; stderr: string }> => {
  const shellsDirectory = path.join(process.cwd(), '/helpers');
  const { stdout, stderr } = await exec(
    `${shellsDirectory}/shells/deleteRepo.sh ${repositoryName}`
  );
  return { stdout, stderr };
};

export const updateRepoShell = async (
  repositoryName: string,
  sshPublicKey: string,
  storageSize: number,
  appendOnlyMode: boolean
): Promise<{ stderr?: string }> => {
  const shellsDirectory = path.join(process.cwd(), '/helpers');
  const { stderr } = await exec(
    `${shellsDirectory}/shells/updateRepo.sh ${repositoryName} "${sshPublicKey}" ${storageSize} ${appendOnlyMode}`
  );
  return { stderr };
};
