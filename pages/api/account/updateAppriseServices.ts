//Lib
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { AppriseServicesDTO } from '~/types/api/notification.types';
import { ErrorResponse } from '~/types/api/error.types';
import { getUsersList, updateUsersList } from '~/helpers/functions/fileHelpers';

export default async function handler(
  req: NextApiRequest & { body: AppriseServicesDTO },
  res: NextApiResponse<ErrorResponse>
) {
  if (req.method !== 'PUT') {
    return res.status(405);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401);
  }

  const { appriseURLs } = req.body;

  try {
    const usersList = await getUsersList();
    const userIndex = usersList.findIndex((user) => user.username === session.user?.name);

    if (userIndex === -1) {
      return res.status(400).json({
        message: 'User is incorrect. Please, logout to update your session.',
      });
    }

    //Build the services URLs list from form
    const appriseURLsArray = appriseURLs
      .replace(/ /g, '')
      .split('\n')
      .filter((el: string) => el != '');

    const updatedUsersList = usersList.map((user, index) =>
      index === userIndex ? { ...user, appriseServices: appriseURLsArray } : user
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
