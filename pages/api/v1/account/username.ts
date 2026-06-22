import { findUserIndexBySession } from '~/helpers/functions';
import { isValidUsername, USERNAME_POLICY_MESSAGE } from '~/helpers/functions/usernamePolicy';
import { ConfigService } from '~/services';
import { getSession } from '~/helpers/getServerSession';
import { syncUsernameChange } from '~/lib/auth-db-sync';
import { NextApiRequest, NextApiResponse } from 'next';
import { ErrorResponse, UsernameSettingDTO } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';

export default async function handler(
  req: NextApiRequest & { body: UsernameSettingDTO },
  res: NextApiResponse<ErrorResponse>
) {
  if (req.method !== 'PUT') {
    return res.status(405);
  }

  const session = await getSession(req, res);
  if (!session) {
    return res.status(401);
  }

  //The data we expect to receive
  const { username } = req.body;

  if (typeof username !== 'string') {
    return res.status(422).json({ message: 'Unexpected data' });
  }
  if (!isValidUsername(username)) {
    res.status(422).json({
      message: USERNAME_POLICY_MESSAGE,
    });
    return;
  }

  try {
    const usersList = await ConfigService.getUsersList();
    const userIndex = findUserIndexBySession(usersList, session);

    if (userIndex === -1) {
      return res.status(400).json({
        message: 'User is incorrect. Please, logout to update your session.',
      });
    }

    // Login normalizes usernames to lowercase, so uniqueness must be case-insensitive
    // (excluding the current user, who may just be changing the casing of their own name).
    const normalized = username.toLowerCase();
    if (
      usersList.some(
        (user, index) => index !== userIndex && user.username.toLowerCase() === normalized
      )
    ) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const updatedUsersList = usersList.map((user, index) =>
      index === userIndex ? { ...user, username } : user
    );
    await ConfigService.updateUsersList(updatedUsersList);
    syncUsernameChange(session.user.id!, username);

    return res.status(200).json({ message: 'Successful API send' });
  } catch (error) {
    return ApiResponse.serverError(res, error);
  }
}
