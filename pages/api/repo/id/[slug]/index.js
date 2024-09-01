import { promises as fs } from 'fs';
import path from 'path';
import { authOptions } from '../../../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import tokenController from '../../../../../helpers/functions/tokenController';

export default async function handler(req, res) {
  if (req.method == 'GET') {
    // AUTHENTICATION
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
        if (!permissions.read) {
          res.status(403).json({ message: 'Insufficient permissions' });
          return;
        }
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
      return;
    }

    try {
      //Find the absolute path of the json directory
      const jsonDirectory = path.join(process.cwd(), '/config');
      //Read the json data file data.json
      let repoList = await fs.readFile(jsonDirectory + '/repo.json', 'utf8');
      //Parse the json data file who has been read
      repoList = JSON.parse(repoList);
      //Find the ID (req.query.slug) in RepoList and put the repo in a single object (repo).
      let repo;
      for (let element in repoList) {
        if (repoList[element].id == req.query.slug) {
          repo = repoList[element];
        }
      }
      //If no repo is found --> 404.
      if (!repo) {
        res.status(404).json({
          message: 'No repository with id #' + req.query.slug,
        });
        return;
      }
      // Send the response and return the repo object --> 200
      res.status(200).json({ repo });
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
  }
}
