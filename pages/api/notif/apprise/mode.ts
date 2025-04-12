import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { ConfigService } from '~/services';
import { authOptions } from '../../auth/[...nextauth]';
import { AppriseModeDTO, ErrorResponse } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AppriseModeDTO | ErrorResponse>
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
      res.status(200).json({
        appriseMode: user.appriseMode,
        appriseStatelessURL: user.appriseStatelessURL,
      });
    } catch (error: any) {
      console.log(error);
      const errorMessage =
        error.code === 'ENOENT'
          ? 'No such file or directory'
          : 'API error, contact the administrator';

      res.status(500).json({ status: 500, message: errorMessage });
    }
  } else if (req.method == 'PUT') {
    const { appriseMode, appriseStatelessURL } = req.body;

    if (!['package', 'stateless'].includes(appriseMode)) {
      return res.status(422).json({ message: 'Unexpected data' });
    }

    try {
      const usersList = await ConfigService.getUsersList();
      const userIndex = usersList.findIndex((user) => user.username === session.user?.name);

      if (userIndex === -1) {
        return res.status(400).json({
          message: 'User is incorrect. Please, logout to update your session.',
        });
      }

      const updatedUsersList = usersList.map((user, index) =>
        index === userIndex ? { ...user, appriseMode, appriseStatelessURL } : user
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
  } else {
    return ApiResponse.methodNotAllowed(res);
  }
}
