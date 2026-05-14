import { ConfigService } from '~/services';
import { getSession } from '~/helpers/getServerSession';
import { syncEmailChange } from '~/lib/auth-db-sync';
import { NextApiRequest, NextApiResponse } from 'next';
import { EmailSettingDTO, ErrorResponse } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';

export default async function handler(
  req: NextApiRequest & { body: EmailSettingDTO },
  res: NextApiResponse<ErrorResponse>
) {
  if (req.method !== 'PUT') {
    return res.status(405);
  }

  const session = await getSession(req, res);
  if (!session) {
    return res.status(401);
  }

  const { email } = req.body;

  if (!email) {
    return res.status(422).json({ message: 'Unexpected data' });
  }

  try {
    const usersList = await ConfigService.getUsersList();
    const userIndex = usersList.findIndex((user) => user.email === session.user?.email);

    if (userIndex === -1) {
      return res.status(400).json({
        message: 'User is incorrect. Please, logout to update your session.',
      });
    }

    if (usersList.some((user) => user.email === email)) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const updatedUsersList = usersList.map((user, index) =>
      index === userIndex ? { ...user, email } : user
    );

    await ConfigService.updateUsersList(updatedUsersList);
    syncEmailChange(session.user.id!, email);
    return res.status(200).json({ message: 'Successful API send' });
  } catch (error) {
    return ApiResponse.serverError(res, error);
  }
}
