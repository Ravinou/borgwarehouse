import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { ConfigService } from '~/services';
import { authOptions } from '~/pages/api/auth/[...nextauth]';
import { EmailAlertDTO, ErrorResponse } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';

export default async function handler(
  req: NextApiRequest & { body: EmailAlertDTO },
  res: NextApiResponse<EmailAlertDTO | ErrorResponse>
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return ApiResponse.unauthorized(res);
  }
  if (req.method == 'GET') {
    try {
      const usersList = await ConfigService.getUsersList();

      //Verify that the user of the session exists
      const user = usersList.find((u) => u.username === session.user?.name);
      if (!user) {
        res.status(400).json({
          message: 'User is incorrect. Please, logout to update your session.',
        });
        return;
      }
      res.status(200).json({ emailAlert: user.emailAlert });
    } catch (error) {
      return ApiResponse.serverError(res, error);
    }
  } else if (req.method == 'PUT') {
    const { emailAlert } = req.body;

    if (typeof emailAlert !== 'boolean') {
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
        index === userIndex ? { ...user, emailAlert } : user
      );

      await ConfigService.updateUsersList(updatedUsersList);
      return res.status(200).json({ message: 'Successful API send' });
    } catch (error) {
      return ApiResponse.serverError(res, error);
    }
  } else {
    return ApiResponse.methodNotAllowed(res);
  }
}
