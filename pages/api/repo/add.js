import { promises as fs } from 'fs';
import path from 'path';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import repoHistory from '../../../helpers/functions/repoHistory';
import tokenController from '../../../helpers/functions/tokenController';
import isSshPubKeyDuplicate from '../../../helpers/functions/isSshPubKeyDuplicate';
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    //AUTHENTICATION
    const FROM_IP = req.headers['x-forwarded-for'] || 'unknown';
    const session = await getServerSession(req, res, authOptions);
    const { authorization } = req.headers;

    if (!session && !authorization) {
      res.status(401).end();
      return;
    }

    try {
      if (authorization) {
        const API_KEY = authorization.split(' ')[1];
        const permissions = await tokenController(API_KEY, FROM_IP);
        if (!permissions) {
          res.status(403).json({ message: 'Invalid API key' });
          return;
        }
        if (!permissions.create) {
          res.status(401).json({ message: 'Insufficient permissions' });
          return;
        }
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
      return;
    }

    //DATA CONTROL
    const { alias, sshPublicKey, size, comment, alert, lanCommand, appendOnlyMode } = req.body;
    //Only "comment" and "lanCommand" are optional in the form.
    if (
      !alias ||
      !sshPublicKey ||
      !size ||
      typeof appendOnlyMode !== 'boolean' ||
      (!alert && alert !== 0)
    ) {
      res.status(422).json({ message: 'Unexpected data' });
      return;
    }

    //ADD REPO
    try {
      //Find the absolute path of the json directory
      const jsonDirectory = path.join(process.cwd(), '/config');
      let repoList = await fs.readFile(jsonDirectory + '/repo.json', 'utf8');
      //Parse the repoList
      repoList = JSON.parse(repoList);

      const sshKeyAlreadyUsed = isSshPubKeyDuplicate(sshPublicKey, repoList);
      if (sshKeyAlreadyUsed) {
        res.status(409).json({
          message:
            'The SSH key is already used in another repository. Please use another key or delete the key from the other repository.',
        });
        return;
      }

      //Find the first biggest ID available to assign it, so the highest ID is already the last added.
      let newID = 0;
      for (let element in repoList) {
        if (newID <= repoList[element].id) {
          newID = repoList[element].id + 1;
        }
      }
      //Create the new repo object
      const newRepo = {
        id: newID,
        alias: alias,
        repositoryName: '',
        status: false,
        lastSave: 0,
        alert: alert,
        storageSize: Number(size),
        storageUsed: 0,
        sshPublicKey: sshPublicKey,
        comment: comment,
        displayDetails: true,
        lanCommand: lanCommand,
        appendOnlyMode: appendOnlyMode,
      };

      ////Call the shell : createRepo.sh
      //Find the absolute path of the shells directory
      const shellsDirectory = path.join(process.cwd(), '/helpers');
      //Exec the shell
      const { stdout } = await exec(
        `${shellsDirectory}/shells/createRepo.sh "${newRepo.sshPublicKey}" ${newRepo.storageSize} ${newRepo.appendOnlyMode}`
      );

      newRepo.repositoryName = stdout.trim();

      //Create the new repoList with the new repo
      let newRepoList = [newRepo, ...repoList];

      //History the new repoList
      await repoHistory(newRepoList);

      //Stringify the newRepoList to write it into the json file.
      newRepoList = JSON.stringify(newRepoList);

      //Write the new json
      await fs.writeFile(jsonDirectory + '/repo.json', newRepoList, (err) => {
        if (err) console.log(err);
      });
      res.status(200).json({ message: 'success' });
    } catch (error) {
      //Log for backend
      console.log(error);
      //Log for frontend
      if (error.code == 'ENOENT') {
        res.status(500).json({
          status: 500,
          message: 'No such file or directory',
        });
      } else {
        res.status(500).json({
          status: 500,
          message: error.stdout,
        });
      }
      return;
    }
  } else {
    res.status(405).json({
      status: 405,
      message: 'Method Not Allowed ',
    });
  }
}
