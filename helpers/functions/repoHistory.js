import { promises as fs } from 'fs';
import path from 'path';

export default async function repoHistory(data) {
  try {
    const repoHistoryDir = path.join(process.cwd(), '/config/versions');
    const maxBackupCount = parseInt(process.env.MAX_REPO_BACKUP_COUNT) || 8;
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
    const jsonData = JSON.stringify(data, null, 2);

    const logData = `\n>>>> History of file repo.json at "${timestamp}" <<<<\n${jsonData}\n`;

    // Écrire ou réécrire le fichier avec le contenu mis à jour
    await fs.appendFile(backupFilePath, logData);
  } catch (error) {
    console.error('An error occurred while saving the repo history :', error.message);
  }
}
