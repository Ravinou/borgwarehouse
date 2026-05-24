import { findUserBySession, findUserIndexBySession } from '~/helpers/functions';
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '~/helpers/getServerSession';
import { ConfigService } from '~/services';
import { AppriseModeDTO, ErrorResponse } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AppriseModeDTO | ErrorResponse>
) {
  const session = await getSession(req, res);
  if (!session) {
    return ApiResponse.unauthorized(res);
  }

  if (req.method == 'GET') {
    try {
      const usersList = await ConfigService.getUsersList();

      //Verify that the user of the session exists
      const user = findUserBySession(usersList, session);
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
    } catch (error) {
      return ApiResponse.serverError(res, error);
    }
  } else if (req.method == 'PUT') {
    const { appriseMode, appriseStatelessURL } = req.body;

    if (!['package', 'stateless'].includes(appriseMode)) {
      return res.status(422).json({ message: 'Unexpected data' });
    }

    try {
      const usersList = await ConfigService.getUsersList();
      const userIndex = findUserIndexBySession(usersList, session);

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
    } catch (error) {
      return ApiResponse.serverError(res, error);
    }
  } else {
    return ApiResponse.methodNotAllowed(res);
  }
}
