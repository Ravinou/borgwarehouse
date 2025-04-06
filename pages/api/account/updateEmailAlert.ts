import { getUsersList, updateUsersList } from '~/services';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { EmailAlertDTO } from '~/types/api/notification.types';
import { NextApiRequest, NextApiResponse } from 'next';
import { ErrorResponse } from '~/types/api/error.types';

export default async function handler(
  req: NextApiRequest & { body: EmailAlertDTO },
  res: NextApiResponse<ErrorResponse>
) {
  if (req.method !== 'PUT') {
    return res.status(405);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401);
  }

  const { emailAlert } = req.body;

  if (typeof emailAlert !== 'boolean') {
    return res.status(422).json({ message: 'Unexpected data' });
  }

  try {
    const usersList = await getUsersList();
    const userIndex = usersList.findIndex((u) => u.username === session.user?.name);

    if (userIndex === -1) {
      return res
        .status(400)
        .json({ message: 'User is incorrect. Please, logout to update your session.' });
    }

    const updatedUsersList = usersList.map((user, index) =>
      index === userIndex ? { ...user, emailAlert } : user
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
