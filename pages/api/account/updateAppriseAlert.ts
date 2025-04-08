// Imports
import { ConfigService } from '~/services';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { AppriseAlertDTO, AppriseAlertResponse } from '~/types/api/notification.types';
import { ErrorResponse } from '~/types/api/error.types';

export default async function handler(
  req: NextApiRequest & { body: AppriseAlertDTO },
  res: NextApiResponse<AppriseAlertResponse | ErrorResponse>
) {
  if (req.method !== 'PUT') {
    return res.status(405);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401);
  }

  const { appriseAlert } = req.body;
  if (typeof appriseAlert !== 'boolean') {
    return res.status(422).json({ message: 'Unexpected data' });
  }

  try {
    const usersList = await ConfigService.getUsersList();
    const userIndex = usersList.findIndex((u) => u.username === session.user?.name);

    if (userIndex === -1) {
      return res
        .status(400)
        .json({ message: 'User is incorrect. Please, logout to update your session.' });
    }

    const updatedUsersList = usersList.map((user, index) =>
      index === userIndex ? { ...user, appriseAlert } : user
    );

    await ConfigService.updateUsersList(updatedUsersList);
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
