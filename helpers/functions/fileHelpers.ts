import { promises as fs } from 'fs';
import path from 'path';
import { Optional } from '~/types';
import { BorgWarehouseUser, Repository } from '~/types/domain/config.types';

// Paths definition
const jsonDirectory = path.join(process.cwd(), '/config');
const usersFilePath = path.join(jsonDirectory, 'users.json');
const repoFilePath = path.join(jsonDirectory, 'repo.json');

export const getUsersList = async (): Promise<BorgWarehouseUser[]> => {
  try {
    const fileContent = await fs.readFile(usersFilePath, 'utf8');
    return JSON.parse(fileContent) || [];
  } catch (error) {
    console.error('Error reading users.json:', error);
    return [];
  }
};

export const updateUsersList = async (usersList: BorgWarehouseUser[]): Promise<void> => {
  try {
    await fs.writeFile(usersFilePath, JSON.stringify(usersList, null, 2));
  } catch (error) {
    console.error('Error writing users.json:', error);
  }
};

export const getRepoList = async (): Promise<Repository[]> => {
  try {
    const fileContent = await fs.readFile(repoFilePath, 'utf8');
    return JSON.parse(fileContent) || [];
  } catch (error) {
    console.error('Error reading repo.json:', error);
    return [];
  }
};

export const updateRepoList = async (repoList: Repository[]): Promise<void> => {
  try {
    await fs.writeFile(repoFilePath, JSON.stringify(repoList, null, 2));
  } catch (error) {
    console.error('Error writing repo.json:', error);
  }
};
