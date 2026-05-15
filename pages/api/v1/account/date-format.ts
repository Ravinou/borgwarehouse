import { ConfigService } from '~/services';
import { getSession } from '~/helpers/getServerSession';
import { NextApiRequest, NextApiResponse } from 'next';
import { DateFormatEnum } from '~/types';
import { DateFormatSettingDTO, ErrorResponse } from '~/types';
import ApiResponse from '~/helpers/functions/apiResponse';

export default async function handler(
  req: NextApiRequest & { body: DateFormatSettingDTO },
  res: NextApiResponse<DateFormatSettingDTO | ErrorResponse>
) {
  const session = await getSession(req, res);
  if (!session) {
    return res.status(401);
  }

  if (req.method === 'GET') {
    try {
      const usersList = await ConfigService.getUsersList();
      const user = usersList.find((u) => u.email === session.user?.email);

      if (!user) {
        return res.status(400).json({ message: 'User not found.' });
      }

      return res.status(200).json({ dateFormat: user.dateFormat ?? DateFormatEnum.LOCALE });
    } catch (error) {
      return ApiResponse.serverError(res, error);
    }
  }

  if (req.method === 'PUT') {
    const { dateFormat } = req.body;

    if (!Object.values(DateFormatEnum).includes(dateFormat)) {
      return res.status(422).json({ message: 'Invalid date format value.' });
    }

    try {
      const usersList = await ConfigService.getUsersList();
      const userIndex = usersList.findIndex((u) => u.email === session.user?.email);

      if (userIndex === -1) {
        return res.status(400).json({
          message: 'User is incorrect. Please, logout to update your session.',
        });
      }

      const updatedUsersList = usersList.map((user, index) =>
        index === userIndex ? { ...user, dateFormat } : user
      );
      await ConfigService.updateUsersList(updatedUsersList);

      return res.status(200).json({ message: 'Successful API send' } as unknown as DateFormatSettingDTO);
    } catch (error) {
      return ApiResponse.serverError(res, error);
    }
  }

  return res.status(405);
}
