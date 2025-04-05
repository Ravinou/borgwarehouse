// dbHelper.ts
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { Mutex } from 'async-mutex';
import { BorgWarehouseUser, Repository } from '~/types/domain/config.types';
import repoHistory from './history.service';

const jsonDirectory = path.join(process.cwd(), '/config');
const usersDbPath = path.join(jsonDirectory, 'users.json');
const repoDbPath = path.join(jsonDirectory, 'repo.json');

// Lowdb config
const usersAdapter = new JSONFile<BorgWarehouseUser[]>(usersDbPath);
const usersDb = new Low(usersAdapter, []);

const repoAdapter = new JSONFile<Repository[]>(repoDbPath);
const repoDb = new Low(repoAdapter, []);

// Mutexes for concurrent access
const usersMutex = new Mutex();
const repoMutex = new Mutex();

// User management
export const getUsersList = async (): Promise<BorgWarehouseUser[]> => {
  try {
    await usersMutex.runExclusive(async () => {
      await usersDb.read();
    });
    return usersDb.data;
  } catch (error) {
    console.log('Error reading users.json:', error);
    return [];
  }
};

export const updateUsersList = async (usersList: BorgWarehouseUser[]): Promise<void> => {
  try {
    await usersMutex.runExclusive(async () => {
      usersDb.data = usersList;
      await usersDb.write();
    });
  } catch (error) {
    console.log('Error writing users.json:', error);
  }
};

// Repository management
export const getRepoList = async (): Promise<Repository[]> => {
  try {
    await repoMutex.runExclusive(async () => {
      await repoDb.read();
    });
    return repoDb.data;
  } catch (error) {
    console.log('Error reading repo.json:', error);
    return [];
  }
};

export const updateRepoList = async (repoList: Repository[], history = false): Promise<void> => {
  try {
    await repoMutex.runExclusive(async () => {
      if (history) {
        await repoHistory(repoList);
      }
      repoDb.data = repoList;
      await repoDb.write();
    });
  } catch (error) {
    console.log('Error writing repo.json:', error);
  }
};
