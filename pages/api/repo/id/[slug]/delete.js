import { promises as fs } from 'fs';
import path from 'path';
import { authOptions } from '../../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import repoHistory from '../../../../../helpers/functions/repoHistory';
import tokenController from '../../../../../helpers/functions/tokenController';
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

export default async function handler(req, res) {
  if (req.method == 'DELETE') {
    //AUTHENTICATION
    const FROM_IP = req.headers['x-forwarded-for'] || 'unknown';
    const session = await getServerSession(req, res, authOptions);
    const { authorization } = req.headers;

    if (!session && !authorization) {
      res.status(401).end();
      return;
    }

    try {
      if (!session && authorization) {
        const API_KEY = authorization.split(' ')[1];
        const permissions = await tokenController(API_KEY, FROM_IP);
        if (!permissions) {
          res.status(401).json({ message: 'Invalid API key' });
          return;
        }
        if (!permissions.delete) {
          res.status(403).json({ message: 'Insufficient permissions' });
          return;
        }
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
      return;
    }

    //If deletion is disabled on the server, return error
    if (process.env.DISABLE_DELETE_REPO === 'true') {
      res.status(403).json({
        message: 'Deletion is disabled on this server',
      });
      return;
    }

    try {
      //console.log('API call (DELETE)');
      //Find the absolute path of the json directory
      const jsonDirectory = path.join(process.cwd(), '/config');
      let repoList = await fs.readFile(jsonDirectory + '/repo.json', 'utf8');
      //Parse the repoList
      repoList = JSON.parse(repoList);

      //Find the ID in the repoList and delete the repo.
      //NOTE : req.query.slug return a string, so parseInt to use with indexOf.
      const indexToDelete = repoList.map((repo) => repo.id).indexOf(parseInt(req.query.slug));

      ////Call the shell : deleteRepo.sh
      //Find the absolute path of the shells directory
      const shellsDirectory = path.join(process.cwd(), '/helpers');
      //Exec the shell
      const { stdout, stderr } = await exec(
        `${shellsDirectory}/shells/deleteRepo.sh ${repoList[indexToDelete].repositoryName}`
      );
      if (stderr) {
        console.log('stderr:', stderr);
        res.status(500).json({
          status: 500,
          message: 'Error on delete, contact the administrator.',
        });
        return;
      }

      //Delete the repo in the repoList
      if (indexToDelete !== -1) {
        repoList.splice(indexToDelete, 1);
      } else {
        console.log('The index to delete does not exist');
        res.status(400).json({
          message: 'This repository does not exist',
        });
        return;
      }
      //History the repoList
      await repoHistory(repoList);
      //Stringify the repoList to write it into the json file.
      repoList = JSON.stringify(repoList);
      //Write the new json
      await fs.writeFile(jsonDirectory + '/repo.json', repoList, (err) => {
        if (err) console.log(err);
      });

      res.status(200).json({ message: 'success' });
    } catch (error) {
      //Log for backend
      console.log(error);
      //Log for frontend
      if (error.code == 'ENOENT') {
        res.status(500).json({
          message: 'No such file or directory',
        });
      } else {
        res.status(500).json({
          message: 'API error, contact the administrator',
        });
      }
      return;
    }
  } else {
    res.status(405).json({
      message: 'Method Not Allowed ',
    });
  }
}
