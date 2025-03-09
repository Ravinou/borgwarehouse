import path from 'path';
import { promisify } from 'util';
import { exec as execCallback } from 'node:child_process';
import { LastSaveDTO } from '~/types/api/shell.types';

const exec = promisify(execCallback);

export const getLastSaveList = async (): Promise<LastSaveDTO[]> => {
  const shellsDirectory = path.join(process.cwd(), '/helpers');
  const { stdout } = await exec(`${shellsDirectory}/shells/getLastSave.sh`);
  return JSON.parse(stdout || '[]');
};
