import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getUsersList } from '~/helpers/functions';
import { ErrorResponse } from '~/types/api/error.types';
import { AppriseServicesDTO } from '~/types/api/notification.types';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AppriseServicesDTO | ErrorResponse>
) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Bad request on API' });
    return;
  }
  //Verify that the user is logged in.
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ message: 'You must be logged in.' });
    return;
  }
  try {
    const usersList = await getUsersList();

    //Verify that the user of the session exists
    const user = usersList.find((u) => u.username === session.user?.name);
    if (!user) {
      res.status(400).json({
        message: 'User is incorrect. Please, logout to update your session.',
      });
      return;
    }

    res.status(200).json({
      appriseServices: user.appriseServices,
    });
  } catch (error: any) {
    console.log(error);
    const errorMessage =
      error.code === 'ENOENT'
        ? 'No such file or directory'
        : 'API error, contact the administrator';

    res.status(500).json({ status: 500, message: errorMessage });
  }
}
