//Lib
import { hashPassword, verifyPassword } from '../../../helpers/functions/auth';
import { promises as fs } from 'fs';
import path from 'path';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

export default async function handler(req, res) {
  if (req.method == 'PUT') {
    //Verify that the user is logged in.
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({ message: 'You must be logged in.' });
      return;
    }

    //The data we expect to receive
    let { oldPassword, newPassword } = req.body;

    //Read the users file
    //Find the absolute path of the json directory
    const jsonDirectory = path.join(process.cwd(), '/config');
    let usersList = await fs.readFile(jsonDirectory + '/users.json', 'utf8');
    //Parse the usersList
    usersList = JSON.parse(usersList);

    //1 : We check that we receive data for each variable.
    if (!oldPassword || !newPassword) {
      //If a variable is empty.
      res.status(400).json({ message: 'A field is missing.' });
      return;
    }
    //Hash the new password
    newPassword = await hashPassword(newPassword);

    //2 : Verify that the user of the session exists
    const userIndex = usersList.map((user) => user.username).indexOf(session.user.name);
    if (userIndex === -1) {
      res.status(400).json({ message: 'User is incorrect.' });
      return;
    }
    const user = usersList[userIndex];

    //3 : Check that the old password is correct
    const isValid = await verifyPassword(oldPassword, user.password);
    if (!isValid) {
      res.status(400).json({ message: 'Old password is incorrect.' });
      return;
    }

    //4 : Change the password
    try {
      //Modify the password for the user
      let newUsersList = usersList.map((user) =>
        user.username == session.user.name ? { ...user, password: newPassword } : user
      );
      //Stringify the new users list
      newUsersList = JSON.stringify(newUsersList);
      //Write the new JSON
      await fs.writeFile(jsonDirectory + '/users.json', newUsersList, (err) => {
        if (err) console.log(err);
      });
      res.status(200).json({ message: 'Successful API send' });
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
