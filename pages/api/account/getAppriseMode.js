//Lib
import { promises as fs } from 'fs';
import path from 'path';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

export default async function handler(req, res) {
  if (req.method == 'GET') {
    //Verify that the user is logged in.
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({ message: 'You must be logged in.' });
      return;
    }
    try {
      //Read the users file
      //Find the absolute path of the json directory
      const jsonDirectory = path.join(process.cwd(), '/config');
      let usersList = await fs.readFile(jsonDirectory + '/users.json', 'utf8');
      //Parse the usersList
      usersList = JSON.parse(usersList);

      //Verify that the user of the session exists
      const userIndex = usersList.map((user) => user.username).indexOf(session.user.name);
      if (userIndex === -1) {
        res.status(400).json({
          message: 'User is incorrect. Please, logout to update your session.',
        });
        return;
      } else {
        //Send the appriseMode object
        res.status(200).json({
          appriseMode: usersList[userIndex].appriseMode,
          appriseStatelessURL: usersList[userIndex].appriseStatelessURL,
        });
        return;
      }
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
          message: 'API error, contact the administrator',
        });
      }
      return;
    }
  } else {
    res.status(405).json({ message: 'Bad request on API' });
  }
}
