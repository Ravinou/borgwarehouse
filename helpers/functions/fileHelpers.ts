import { promises as fs } from 'fs';
import path from 'path';
import { BorgWarehouseUser } from '~/types/domain/config.types';

// Paths definition
const jsonDirectory = path.join(process.cwd(), '/config');
const usersFilePath = path.join(jsonDirectory, 'users.json');

export const getUsersList = async (): Promise<BorgWarehouseUser[]> => {
  const fileContent = await fs.readFile(usersFilePath, 'utf8');
  return JSON.parse(fileContent);
};

export const updateUsersList = async (usersList: BorgWarehouseUser[]): Promise<void> => {
  await fs.writeFile(usersFilePath, JSON.stringify(usersList, null, 2));
};
