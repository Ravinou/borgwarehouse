import { promises as fs } from 'fs';
import path from 'path';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { alertOptions } from '../../../domain/constants';
import repoHistory from '../../../helpers/functions/repoHistory';
import tokenController from '../../../helpers/functions/tokenController';
import isSshPubKeyDuplicate from '../../../helpers/functions/isSshPubKeyDuplicate';
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 405, message: 'Method Not Allowed' });
  }

  // AUTHENTICATION
  const FROM_IP = req.headers['x-forwarded-for'] || 'unknown';
  const session = await getServerSession(req, res, authOptions);
  const { authorization } = req.headers;

  if (!(await isAuthenticated(session, authorization, FROM_IP))) {
    res.status(401).json({ message: 'Invalid API key' });
    return;
  }

  // DATA CONTROL
  const { alias, sshPublicKey, storageSize, comment, alert, lanCommand, appendOnlyMode } = req.body;

  if (!isValidRepoData(req.body)) {
    return res.status(422).json({ message: 'Unexpected data' });
  }

  try {
    const repoList = await getRepoList();

    if (isSshKeyConflict(sshPublicKey, repoList)) {
      return res.status(409).json({
        message:
          'The SSH key is already used in another repository. Please use another key or delete the key from the other repository.',
      });
    }

    const newRepo = await createNewRepo(repoList, {
      alias,
      sshPublicKey,
      storageSize,
      comment,
      alert,
      lanCommand,
      appendOnlyMode,
    });
    const newRepoList = [newRepo, ...repoList];

    await saveRepoList(newRepoList);

    return res.status(200).json({ id: newRepo.id, repositoryName: newRepo.repositoryName });
  } catch (error) {
    handleError(error, res);
  }
}

// --------------
// Functions
// --------------
async function isAuthenticated(session, authorization, FROM_IP) {
  if (session) return true;

  if (authorization) {
    const API_KEY = authorization.split(' ')[1];
    const permissions = await tokenController(API_KEY, FROM_IP);
    return permissions?.create;
  }
  return false;
}

function isValidRepoData(body) {
  const { alias, sshPublicKey, storageSize, comment, alert, lanCommand, appendOnlyMode } = body;
  const expectedKeys = [
    'alias',
    'sshPublicKey',
    'storageSize',
    'comment',
    'alert',
    'lanCommand',
    'appendOnlyMode',
  ];

  const isValidData =
    typeof alias === 'string' &&
    alias.trim() !== '' &&
    typeof sshPublicKey === 'string' &&
    sshPublicKey.trim() !== '' &&
    typeof comment === 'string' &&
    typeof storageSize === 'number' &&
    Number.isInteger(storageSize) &&
    storageSize > 0 &&
    typeof alert === 'number' &&
    alertOptions.some((option) => option.value === alert) &&
    typeof lanCommand === 'boolean' &&
    typeof appendOnlyMode === 'boolean';

  const hasUnexpectedKeys = Object.keys(body).some((key) => !expectedKeys.includes(key));

  return isValidData && !hasUnexpectedKeys;
}

async function getRepoList() {
  const jsonDirectory = path.join(process.cwd(), '/config');
  const repoData = await fs.readFile(jsonDirectory + '/repo.json', 'utf8');
  return JSON.parse(repoData);
}

function isSshKeyConflict(sshPublicKey, repoList) {
  return typeof sshPublicKey === 'string' && isSshPubKeyDuplicate(sshPublicKey, repoList);
}

async function createNewRepo(
  repoList,
  { alias, sshPublicKey, storageSize, comment, alert, lanCommand, appendOnlyMode }
) {
  const newID = repoList.length > 0 ? Math.max(...repoList.map((repo) => repo.id)) + 1 : 0;

  const newRepo = {
    id: newID,
    alias,
    repositoryName: '',
    status: false,
    lastSave: 0,
    lastStatusAlertSend: Math.floor(Date.now() / 1000),
    alert,
    storageSize: Number(storageSize),
    storageUsed: 0,
    sshPublicKey,
    comment,
    displayDetails: true,
    lanCommand,
    appendOnlyMode,
  };

  const shellsDirectory = path.join(process.cwd(), '/helpers');
  const { stdout } = await exec(
    `${shellsDirectory}/shells/createRepo.sh "${newRepo.sshPublicKey}" ${newRepo.storageSize} ${newRepo.appendOnlyMode}`
  );

  newRepo.repositoryName = stdout.trim();
  return newRepo;
}

async function saveRepoList(newRepoList) {
  const jsonDirectory = path.join(process.cwd(), '/config');
  await repoHistory(newRepoList);
  await fs.writeFile(jsonDirectory + '/repo.json', JSON.stringify(newRepoList));
}

function handleError(error, res) {
  console.log(error);
  if (error.code === 'ENOENT') {
    res.status(500).json({ message: 'No such file or directory' });
  } else {
    res.status(500).json({ message: error.stdout });
  }
}
