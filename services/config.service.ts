import { Low } from 'lowdb';
import { promises as fs } from 'fs';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { Mutex } from 'async-mutex';
import { BorgWarehouseUser, Repository } from '~/types/domain/config.types';

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

export const ConfigService = {
  getUsersList: async (): Promise<BorgWarehouseUser[]> => {
    try {
      await usersMutex.runExclusive(async () => {
        await usersDb.read();
      });
      return usersDb.data;
    } catch (error) {
      console.log('Error reading users.json:', error);
      return [];
    }
  },

  updateUsersList: async (usersList: BorgWarehouseUser[]): Promise<void> => {
    try {
      await usersMutex.runExclusive(async () => {
        usersDb.data = usersList;
        await usersDb.write();
      });
    } catch (error) {
      console.log('Error writing users.json:', error);
    }
  },

  getRepoList: async (): Promise<Repository[]> => {
    try {
      await repoMutex.runExclusive(async () => {
        await repoDb.read();
      });
      return repoDb.data;
    } catch (error) {
      console.log('Error reading repo.json:', error);
      return [];
    }
  },

  updateRepoList: async (repoList: Repository[], history = false): Promise<void> => {
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
  },
};

// Repository history management
async function repoHistory(repoList: Repository[]) {
  try {
    const repoHistoryDir = path.join(process.cwd(), '/config/versions');
    const maxBackupCount = parseInt(process.env.MAX_REPO_BACKUP_COUNT ?? '8', 10);
    const timestamp = new Date().toISOString();
    const backupDate = timestamp.split('T')[0];

    //Create the directory if it does not exist
    await fs.mkdir(repoHistoryDir, { recursive: true });

    const existingBackups = await fs.readdir(repoHistoryDir);

    if (existingBackups.length >= maxBackupCount) {
      existingBackups.sort();
      const backupsToDelete = existingBackups.slice(0, existingBackups.length - maxBackupCount + 1);
      for (const backupToDelete of backupsToDelete) {
        const backupFilePathToDelete = path.join(repoHistoryDir, backupToDelete);
        await fs.unlink(backupFilePathToDelete);
      }
    }

    const backupFileName = `${backupDate}.log`;
    const backupFilePath = path.join(repoHistoryDir, backupFileName);
    const jsonData = JSON.stringify(repoList, null, 2);

    const logData = `\n>>>> History of file repo.json at "${timestamp}" <<<<\n${jsonData}\n`;

    await fs.appendFile(backupFilePath, logData);
  } catch (error) {
    console.log('An error occurred while saving the repo history :', error);
  }
}
