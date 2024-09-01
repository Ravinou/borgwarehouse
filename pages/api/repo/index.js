import fs from 'fs';
import path from 'path';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import tokenController from '../../../helpers/functions/tokenController';

export default async function handler(req, res) {
  if (req.method === 'GET') {
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

    // GET REPO LIST
    try {
      //Find the absolute path of the json directory
      const jsonDirectory = path.join(process.cwd(), '/config');
      //Check if the repo.json file exists and initialize it if not.
      if (!fs.existsSync(jsonDirectory + '/repo.json')) {
        fs.writeFileSync(jsonDirectory + '/repo.json', JSON.stringify([]));
      }
      //Read the file repo.json
      let repoList = await fs.promises.readFile(jsonDirectory + '/repo.json', 'utf8');
      repoList = JSON.parse(repoList);
      res.status(200).json({ repoList });
    } catch (error) {
      console.log(error);
      if (error.code == 'ENOENT') {
        res.status(500).json({
          message: 'No such file or directory',
        });
      } else {
        res.status(500).json({
          message: 'API error, contact the administrator !',
        });
      }
      return;
    }
  } else {
    res.status(405).json({
      message: 'Method Not Allowed ',
    });
    return;
  }
}
