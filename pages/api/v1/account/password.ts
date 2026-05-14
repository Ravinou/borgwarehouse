import { ConfigService, AuthService } from '~/services';
import { getSession } from '~/helpers/getServerSession';
import { syncPasswordChange } from '~/lib/auth-db-sync';
import { NextApiRequest, NextApiResponse } from 'next';
import { ErrorResponse, PasswordSettingDTO } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';

export default async function handler(
  req: NextApiRequest & { body: PasswordSettingDTO },
  res: NextApiResponse<ErrorResponse>
) {
  if (req.method !== 'PUT') {
    return res.status(405);
  }

  const session = await getSession(req, res);
  if (!session) {
    return res.status(401);
  }

  const { oldPassword, newPassword } = req.body;

  if (typeof oldPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(422).json({ message: 'Unexpected data' });
  }

  try {
    const usersList = await ConfigService.getUsersList();
    const userIndex = usersList.findIndex((user) => user.username === session.user?.name);
    const user = usersList[userIndex];

    if (userIndex === -1 || !user) {
      return res.status(400).json({
        message: 'User is incorrect. Please, logout to update your session.',
      });
    }

    const isValidPassword = await AuthService.verifyPassword(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }

    const newPasswordHash = await AuthService.hashPassword(newPassword);
    const updatedUsersList = usersList.map((user, index) =>
      index === userIndex ? { ...user, password: newPasswordHash } : user
    );

    await ConfigService.updateUsersList(updatedUsersList);
    syncPasswordChange(session.user.id!, newPasswordHash);

    return res.status(200).json({ message: 'Successful API send' });
  } catch (error) {
    return ApiResponse.serverError(res, error);
  }
}
