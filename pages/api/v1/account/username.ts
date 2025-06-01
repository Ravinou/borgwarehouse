import { ConfigService } from '~/services';
import { authOptions } from '~/pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
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

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401);
  }

  //The data we expect to receive
  const { username } = req.body;

  if (typeof username !== 'string') {
    return res.status(422).json({ message: 'Unexpected data' });
  }
  const usernameRegex = new RegExp(/^[a-z]{1,40}$/);
  if (!usernameRegex.test(username)) {
    res.status(422).json({
      message: 'Only a-z characters are allowed (1 to 40 char.)',
    });
    return;
  }

  try {
    const usersList = await ConfigService.getUsersList();
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
    await ConfigService.updateUsersList(updatedUsersList);

    return res.status(200).json({ message: 'Successful API send' });
  } catch (error) {
    return ApiResponse.serverError(res, error);
  }
}
