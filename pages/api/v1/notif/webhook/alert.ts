import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '~/helpers/getServerSession';
import { ConfigService } from '~/services';
import { WebhookAlertDTO, ErrorResponse } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';

export default async function handler(
  req: NextApiRequest & { body: WebhookAlertDTO },
  res: NextApiResponse<WebhookAlertDTO | ErrorResponse>
) {
  const session = await getSession(req, res);
  if (!session) return ApiResponse.unauthorized(res);

  if (req.method === 'GET') {
    try {
      const usersList = await ConfigService.getUsersList();
      const user = usersList.find((u) => u.email === session.user?.email);
      if (!user)
        return res
          .status(400)
          .json({ message: 'User is incorrect. Please, logout to update your session.' });

      return res.status(200).json({ webhookAlert: user.webhookAlert ?? false });
    } catch (error) {
      return ApiResponse.serverError(res, error);
    }
  }

  if (req.method === 'PUT') {
    const { webhookAlert } = req.body;
    if (typeof webhookAlert !== 'boolean')
      return res.status(422).json({ message: 'Unexpected data' });

    try {
      const usersList = await ConfigService.getUsersList();
      const userIndex = usersList.findIndex((u) => u.email === session.user?.email);
      if (userIndex === -1)
        return res
          .status(400)
          .json({ message: 'User is incorrect. Please, logout to update your session.' });

      const updatedUsersList = usersList.map((user, index) =>
        index === userIndex ? { ...user, webhookAlert } : user
      );
      await ConfigService.updateUsersList(updatedUsersList);
      return res.status(200).json({ message: 'Successful API send' } as unknown as WebhookAlertDTO);
    } catch (error) {
      return ApiResponse.serverError(res, error);
    }
  }

  return ApiResponse.methodNotAllowed(res);
}
