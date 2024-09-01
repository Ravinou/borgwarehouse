//Lib
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
    let { email } = req.body;

    //Read the users file
    //Find the absolute path of the json directory
    const jsonDirectory = path.join(process.cwd(), '/config');
    let usersList = await fs.readFile(jsonDirectory + '/users.json', 'utf8');
    //Parse the usersList
    usersList = JSON.parse(usersList);

    //1 : We check that we receive data.
    if (!email) {
      //If a variable is empty.
      res.status(400).json({ message: 'A field is missing.' });
      return;
    }

    //2 : control the data
    const emailRegex = new RegExp(
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'Your email is not valid' });
      return;
    }

    //3 : Verify that the user of the session exists
    const userIndex = usersList.map((user) => user.username).indexOf(session.user.name);
    if (userIndex === -1) {
      res.status(400).json({
        message: 'User is incorrect. Please, logout to update your session.',
      });
      return;
    }

    //4 : Change the email
    try {
      //Modify the email for the user
      let newUsersList = usersList.map((user) =>
        user.username == session.user.name ? { ...user, email: email } : user
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
