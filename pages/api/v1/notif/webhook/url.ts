import { findUserBySession, findUserIndexBySession } from '~/helpers/functions';
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '~/helpers/getServerSession';
import { ConfigService } from '~/services';
import { WebhookURLDTO, ErrorResponse } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';

export default async function handler(
  req: NextApiRequest & { body: WebhookURLDTO },
  res: NextApiResponse<WebhookURLDTO | ErrorResponse>
) {
  const session = await getSession(req, res);
  if (!session) return ApiResponse.unauthorized(res);

  if (req.method === 'GET') {
    try {
      const usersList = await ConfigService.getUsersList();
      const user = findUserBySession(usersList, session);
      if (!user)
        return res
          .status(400)
          .json({ message: 'User is incorrect. Please, logout to update your session.' });

      return res.status(200).json({ webhookURL: user.webhookURL ?? '', webhookSecret: user.webhookSecret ?? '' });
    } catch (error) {
      return ApiResponse.serverError(res, error);
    }
  }

  if (req.method === 'PUT') {
    const { webhookURL, webhookSecret } = req.body;

    if (typeof webhookURL !== 'string') {
      return res.status(422).json({ message: 'Unexpected data.' });
    }

    if (webhookURL.trim() !== '') {
      try {
        new URL(webhookURL);
      } catch {
        return res.status(422).json({ message: 'Invalid webhook URL.' });
      }
    }

    try {
      const usersList = await ConfigService.getUsersList();
      const userIndex = findUserIndexBySession(usersList, session);
      if (userIndex === -1)
        return res
          .status(400)
          .json({ message: 'User is incorrect. Please, logout to update your session.' });

      const updatedUsersList = usersList.map((user, index) =>
        index === userIndex
          ? { ...user, webhookURL: webhookURL.trim(), webhookSecret: webhookSecret?.trim() ?? '' }
          : user
      );
      await ConfigService.updateUsersList(updatedUsersList);
      return res.status(200).json({ message: 'Successful API send' } as unknown as WebhookURLDTO);
    } catch (error) {
      return ApiResponse.serverError(res, error);
    }
  }

  return ApiResponse.methodNotAllowed(res);
}
