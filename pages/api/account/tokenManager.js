//Lib
import { promises as fs } from 'fs';
import path from 'path';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

export default async function handler(req, res) {
  if (req.method == 'POST') {
    //Verify that the user is logged in.
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({ message: 'You must be logged in.' });
      return;
    }

    //The data we expect to receive
    let { name, token, creation, expiration, permissions } = req.body;

    //Read the users file
    //Find the absolute path of the json directory
    const jsonDirectory = path.join(process.cwd(), '/config');
    let usersList = await fs.readFile(jsonDirectory + '/users.json', 'utf8');
    //Parse the usersList
    usersList = JSON.parse(usersList);

    //1 : We check that we receive data for each variable.
    if (!name || !token || !creation || !permissions) {
      res.status(400).json({ message: 'A field is missing.' });
      return;
    }

    //Control the data
    const nameRegex = new RegExp('^[a-zA-Z0-9_-]{1,25}$');
    if (!nameRegex.test(name)) {
      res.status(400).json({ message: 'Your token name is not valid' });
      return;
    }

    //2 : Verify that the user of the session exists
    const userIndex = usersList.map((user) => user.username).indexOf(session.user.name);
    if (userIndex === -1) {
      res.status(400).json({ message: 'User is incorrect.' });
      return;
    }
    const user = usersList[userIndex];

    //3 : Check that the tokenName or tokenValue already exists
    const tokenExists =
      user.tokens && user.tokens.some((existingToken) => existingToken.name === name);
    if (tokenExists) {
      res.status(400).json({
        message: 'A token with this name already exists.',
      });
      return;
    }

    //4 : Add the new token
    try {
      let newUsersList = usersList.map((user) =>
        user.username == session.user.name
          ? {
              ...user,
              tokens: [
                ...(user.tokens || []),
                {
                  name,
                  token,
                  creation,
                  expiration,
                  permissions,
                },
              ],
            }
          : user
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
  } else if (req.method == 'GET') {
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
        //Send the token list without tokens
        res.status(200).json([
          ...(usersList[userIndex].tokens && Array.isArray(usersList[userIndex].tokens)
            ? usersList[userIndex].tokens.map((token) => ({
                name: token.name,
                creation: token.creation,
                expiration: token.expiration,
                permissions: token.permissions,
              }))
            : []),
        ]);
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
  } else if (req.method == 'DELETE') {
    //Verify that the user is logged in.
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({ message: 'You must be logged in.' });
      return;
    }

    //The data we expect to receive
    let { name } = req.body;

    //Read the users file
    //Find the absolute path of the json directory
    const jsonDirectory = path.join(process.cwd(), '/config');
    let usersList = await fs.readFile(jsonDirectory + '/users.json', 'utf8');
    //Parse the usersList
    usersList = JSON.parse(usersList);

    //1 : We check that we receive data for each variable.
    if (!name) {
      res.status(400).json({ message: 'A field is missing.' });
      return;
    }

    //2 : Verify that the user of the session exists
    const userIndex = usersList.map((user) => user.username).indexOf(session.user.name);
    if (userIndex === -1) {
      res.status(400).json({ message: 'User is incorrect.' });
      return;
    }
    const user = usersList[userIndex];

    //Control the data
    const tokenExists = user.tokens.some((existingToken) => existingToken.name === name);
    if (!tokenExists) {
      res.status(400).json({ message: 'Token not found.' });
      return;
    }

    //3 : Delete the token object if it exists
    try {
      let newUsersList = usersList.map((user) =>
        user.username == session.user.name
          ? {
              ...user,
              tokens: user.tokens.filter((token) => token.name != name),
            }
          : user
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
