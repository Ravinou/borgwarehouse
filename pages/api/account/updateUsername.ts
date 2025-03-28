import { getUsersList, updateUsersList } from '~/helpers/functions';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { UsernameSettingDTO } from '~/types/api/setting.types';
import { NextApiRequest, NextApiResponse } from 'next';
import { ErrorResponse } from '~/types/api/error.types';

export default async function handler(
  req: NextApiRequest & { body: UsernameSettingDTO },
  res: NextApiResponse<ErrorResponse>
) {
  if (req.method !== 'PUT') {
    return res.status(405);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401);
  }

  //The data we expect to receive
  let { username } = req.body;

  if (typeof username !== 'string') {
    return res.status(422).json({ message: 'Unexpected data' });
  }
  const usernameRegex = new RegExp(/^[a-z]{5,15}$/);
  if (!usernameRegex.test(username)) {
    res.status(422).json({
      message: 'Only a-z characters are allowed (5 to 15 char.)',
    });
    return;
  }

  try {
    const usersList = await getUsersList();
    const userIndex = usersList.findIndex((user) => user.username === session.user?.name);

    if (userIndex === -1) {
      return res.status(400).json({
        message: 'User is incorrect. Please, logout to update your session.',
      });
    }

    if (usersList.some((user) => user.username === username)) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const updatedUsersList = usersList.map((user, index) =>
      index === userIndex ? { ...user, username } : user
    );
    await updateUsersList(updatedUsersList);

    return res.status(200).json({ message: 'Successful API send' });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      status: 500,
      message:
        error.code === 'ENOENT'
          ? 'No such file or directory'
          : 'API error, contact the administrator',
    });
  }
}
