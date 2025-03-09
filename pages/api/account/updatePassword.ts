import { getUsersList, updateUsersList, hashPassword, verifyPassword } from '~/helpers/functions';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { ErrorResponse } from '~/types/api/error.types';
import { PasswordSettingDTO } from '~/types/api/setting.types';

export default async function handler(
  req: NextApiRequest & { body: PasswordSettingDTO },
  res: NextApiResponse<ErrorResponse>
) {
  if (req.method !== 'PUT') {
    return res.status(405);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401);
  }

  const { oldPassword, newPassword } = req.body;

  if (typeof oldPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(422).json({ message: 'Unexpected data' });
  }

  try {
    const usersList = await getUsersList();
    const userIndex = usersList.findIndex((user) => user.username === session.user?.name);
    const user = usersList[userIndex];

    if (userIndex === -1 || !user) {
      return res.status(400).json({
        message: 'User is incorrect. Please, logout to update your session.',
      });
    }

    const isValidPassword = await verifyPassword(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }

    const newPasswordHash = await hashPassword(newPassword);
    const updatedUsersList = usersList.map((user, index) =>
      index === userIndex ? { ...user, password: newPasswordHash } : user
    );

    await updateUsersList(updatedUsersList);

    return res.status(200).json({ message: 'Successful API send' });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message:
        error.code === 'ENOENT'
          ? 'No such file or directory'
          : 'API error, contact the administrator',
    });
  }
}
